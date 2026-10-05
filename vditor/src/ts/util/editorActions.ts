import { getEventName, isCtrl, isMacPlatform } from "./compatibility";
import { matchHotKey } from "./hotKey";

/**
 * 编辑器动作注册表(cweijan-204/218): 集中管理可绑定快捷键的编辑动作。
 * - 默认键位为 vditor hotkey 格式(平台感知), 用户覆盖为 VS Code 风格("ctrl+shift+z", 空串=禁用);
 * - 触发通道: webview keydown(handleActionHotkey) 与宿主命令(executeEditorAction),
 *   两通道 300ms 内互相去重, 防止同一次按键被 VS Code keybinding 与 iframe keydown 双触发。
 */

/** VS Code 风格组合键的解析结果 */
interface ParsedHotkey {
    /** ⌘ 语义: macOS 上为 metaKey, 其他平台为 ctrlKey */
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
}

interface EditorAction {
    id: string;
    /** 对应 toolbar 菜单项名, 执行时派发其点击事件 */
    toolbar?: string;
    /** 默认键位(vditor hotkey 格式), 不提供则回退 toolbar 项的 hotkey */
    defaultHotkeys?: string[];
    /** macOS 下不提供默认键位(headings: 不抢占系统 ⌘H, cweijan-218) */
    noMacDefault?: boolean;
    execute: (vditor: IVditor) => void;
}

const SPECIAL_KEY_ALIASES: { [key: string]: string } = {
    enter: "enter",
    esc: "escape",
    escape: "escape",
    space: " ",
    tab: "tab",
    up: "arrowup",
    down: "arrowdown",
    left: "arrowleft",
    right: "arrowright",
};

const isSupportedKey = (key: string): boolean =>
    key.length === 1 || key === "enter" || key === "escape" || key === "tab"
    || /^arrow(up|down|left|right)$/.test(key);

/** 解析 VS Code 风格组合键("cmd+shift+z"/"ctrl+alt+1"); 空串=禁用(返回 null 且视为有效禁用), 非法值返回 null */
export const parseUserHotkey = (value: string): ParsedHotkey | null => {
    if (!value || !value.trim()) {
        return null;
    }
    const parts = value.trim().toLowerCase().split("+")
        .map((part) => part.trim()).filter(Boolean);
    if (!parts.length) {
        return null;
    }
    const rawKey = parts[parts.length - 1];
    const key = SPECIAL_KEY_ALIASES[rawKey] ?? rawKey;
    if (!isSupportedKey(key)) {
        return null;
    }
    let ctrl = false;
    let shift = false;
    let alt = false;
    for (const part of parts.slice(0, -1)) {
        if (part === "ctrl" || part === "cmd" || part === "meta" || part === "win") {
            ctrl = true;
        } else if (part === "shift") {
            shift = true;
        } else if (part === "alt" || part === "option" || part === "opt") {
            alt = true;
        } else {
            return null;
        }
    }
    return { ctrl, shift, alt, key };
};

const normalizeEventKey = (event: KeyboardEvent): string =>
    event.key === " " ? " " : event.key.toLowerCase();

const matchParsedHotkey = (parsed: ParsedHotkey, event: KeyboardEvent): boolean =>
    isCtrl(event) === parsed.ctrl && event.shiftKey === parsed.shift
    && event.altKey === parsed.alt && normalizeEventKey(event) === parsed.key;

const execToolbarAction = (vditor: IVditor, name: string) => {
    const element = vditor.toolbar?.elements?.[name];
    if (element?.children?.[0]) {
        element.children[0].dispatchEvent(new CustomEvent(getEventName()));
        return;
    }
    // 用户自定义 toolbar 移除该项时, undo/redo 直接走编辑器 API 兜底
    if (name === "undo") {
        vditor.undo.undo(vditor);
    } else if (name === "redo") {
        vditor.undo.redo(vditor);
    }
};

const toolbarAction = (id: string, toolbar: string,
    defaultHotkeys?: string[], noMacDefault?: boolean): EditorAction => ({
        id,
        toolbar,
        defaultHotkeys,
        noMacDefault,
        execute: (vditor) => execToolbarAction(vditor, toolbar),
    });

export const EDITOR_ACTIONS: EditorAction[] = [
    toolbarAction("undo", "undo", ["⌘Z"]),
    // redo 默认键补平台惯例: ⇧⌘Z 在 Windows/Linux 映射为 Ctrl+Shift+Z(cweijan-204)
    toolbarAction("redo", "redo", ["⌘Y", "⇧⌘Z"]),
    // macOS 不绑定默认键, 不抢占系统「隐藏应用」(cweijan-218)
    toolbarAction("headings", "headings", ["⌘H"], true),
    toolbarAction("bold", "bold"),
    toolbarAction("italic", "italic"),
    toolbarAction("strike", "strike"),
    toolbarAction("link", "link"),
    toolbarAction("ordered-list", "ordered-list"),
    toolbarAction("check", "check"),
    toolbarAction("quote", "quote"),
    toolbarAction("line", "line"),
    toolbarAction("code", "code"),
    toolbarAction("inline-code", "inline-code"),
    toolbarAction("table", "table"),
];

export const EDITOR_ACTION_IDS = EDITOR_ACTIONS.map((action) => action.id);

/** 该 toolbar 项是否已被注册表管理(toolbar 通用匹配段需跳过, 避免默认键双触发) */
export const isManagedToolbarAction = (toolbarName: string): boolean =>
    EDITOR_ACTIONS.some((action) => action.toolbar === toolbarName);

const getDefaultHotkeys = (vditor: IVditor, action: EditorAction): string[] => {
    if (action.noMacDefault && isMacPlatform()) {
        return [];
    }
    if (action.defaultHotkeys) {
        return action.defaultHotkeys;
    }
    const item = vditor.options.toolbar?.find(
        (menuItem): menuItem is IMenuItem =>
            typeof menuItem === "object" && menuItem.name === action.toolbar);
    return item?.hotkey ? [item.hotkey] : [];
};

const getActionHotkeys = (vditor: IVditor, action: EditorAction): (string | ParsedHotkey)[] => {
    const override = vditor.options.hotkeys?.[action.id];
    if (typeof override === "string") {
        if (override.trim() === "") {
            return [];
        }
        const parsed = parseUserHotkey(override);
        if (parsed) {
            return [parsed];
        }
        // 非法配置回退默认键
    }
    return getDefaultHotkeys(vditor, action);
};

const matchActionHotkey = (vditor: IVditor, action: EditorAction, event: KeyboardEvent): boolean =>
    getActionHotkeys(vditor, action).some((hotkey) =>
        typeof hotkey === "string"
            ? matchHotKey(hotkey, event)
            : matchParsedHotkey(hotkey, event));

/** 两通道(keydown / 宿主命令)去重窗口 */
const DEDUPE_MS = 300;
const recentHits = new Map<string, number>();

const shouldSkipForDedupe = (id: string): boolean => {
    const lastHit = recentHits.get(id);
    return lastHit !== undefined && Date.now() - lastHit < DEDUPE_MS;
};

const runAction = (vditor: IVditor, action: EditorAction) => {
    recentHits.set(action.id, Date.now());
    action.execute(vditor);
};

/** keydown 主链入口: 命中注册表动作则执行并拦截事件, 返回 true 表示已消费 */
export const handleActionHotkey = (vditor: IVditor, event: KeyboardEvent): boolean => {
    if (event.isComposing) {
        return false;
    }
    for (const action of EDITOR_ACTIONS) {
        if (matchActionHotkey(vditor, action, event)) {
            if (!shouldSkipForDedupe(action.id)) {
                runAction(vditor, action);
            }
            event.preventDefault();
            event.stopPropagation();
            return true;
        }
    }
    return false;
};

/** 宿主命令通道入口: 执行指定动作, 返回是否为已知动作 */
export const executeEditorAction = (vditor: IVditor, actionId: string): boolean => {
    const action = EDITOR_ACTIONS.find((item) => item.id === actionId);
    if (!action) {
        return false;
    }
    if (!shouldSkipForDedupe(action.id)) {
        runAction(vditor, action);
    }
    return true;
};
