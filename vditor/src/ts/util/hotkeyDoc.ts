import { updateHotkeyTip } from "./compatibility";

/**
 * 编辑器快捷键说明数据(cweijan-204 衍生): 以代码实际处理为准的全量清单,
 * 供工具栏「快捷键」面板(Hotkeys.ts)渲染。键位为 vditor hotkey 格式,
 * 展示时经 updateHotkeyTip 做平台转换(mac ⌘ / 其他 Ctrl)。
 * 同一动作多个触发键用 " · " 分隔;新增/调整键位时同步维护本表。
 */

interface IHotkeyDocEntry {
    /** vditor hotkey 格式, 多键用 " · " 分隔 */
    hotkey: string;
    /** 功能描述(VditorI18n 词条) */
    descKey: string;
}

interface IHotkeyDocGroup {
    /** 分组标题(VditorI18n 词条) */
    titleKey: string;
    entries: IHotkeyDocEntry[];
}

export const HOTKEY_DOC_GROUPS: IHotkeyDocGroup[] = [
    {
        titleKey: "undo",
        entries: [
            { hotkey: "⌘Z", descKey: "undo" },
            { hotkey: "⌘Y · ⇧⌘Z", descKey: "redo" },
            { hotkey: "⌘F", descKey: "find" },
            { hotkey: "⌘R", descKey: "replace" },
        ],
    },
    {
        titleKey: "bold",
        entries: [
            { hotkey: "⌘B", descKey: "bold" },
            { hotkey: "⌘I", descKey: "italic" },
            { hotkey: "⌘D", descKey: "strike" },
            { hotkey: "⌘K", descKey: "link" },
            { hotkey: "⌘G", descKey: "inline-code" },
            { hotkey: "⌘U", descKey: "code" },
            { hotkey: "⌘;", descKey: "quote" },
            { hotkey: "⇧⌘H", descKey: "line" },
            { hotkey: "⇧⌘;", descKey: "wrapBlockquote" },
        ],
    },
    {
        titleKey: "headings",
        entries: [
            { hotkey: "⌘H", descKey: "headings" },
            { hotkey: "⌥⌘1 ~ ⌥⌘6", descKey: "heading1" },
            { hotkey: "⌘O", descKey: "ordered-list" },
            { hotkey: "⌘J", descKey: "check" },
            { hotkey: "⇧⌘J", descKey: "toggleTask" },
            { hotkey: "⌘M", descKey: "table" },
            { hotkey: "⌘=", descKey: "headingUp" },
            { hotkey: "⌘-", descKey: "headingDown" },
        ],
    },
    {
        titleKey: "moveBlockUp",
        entries: [
            { hotkey: "⌥↑ · ⌥↓", descKey: "moveBlockUp" },
            { hotkey: "⇧⌥↑ · ⇧⌥↓", descKey: "copyBlockUp" },
            { hotkey: "⌘L", descKey: "selectBlock" },
            { hotkey: "⇧⌘K · ⇧⌘X", descKey: "deleteBlock" },
            { hotkey: "⌘Enter", descKey: "insertBlockBelow" },
            { hotkey: "⇧⌘Enter", descKey: "insertBlockAbove" },
        ],
    },
    {
        titleKey: "table",
        entries: [
            { hotkey: "⇧⌘F", descKey: "insertRowAbove" },
            { hotkey: "⌘=", descKey: "insertRowBelow" },
            { hotkey: "⇧⌘G", descKey: "insertColumnLeft" },
            { hotkey: "⇧⌘=", descKey: "insertColumnRight" },
            { hotkey: "⌘-", descKey: "deleteRow" },
            { hotkey: "⇧⌘-", descKey: "deleteColumn" },
            { hotkey: "⇧⌘L", descKey: "alignLeft" },
            { hotkey: "⇧⌘C", descKey: "alignCenter" },
            { hotkey: "⇧⌘R", descKey: "alignRight" },
        ],
    },
    {
        titleKey: "edit-mode",
        entries: [
            { hotkey: "⌥⌘7 · ⌥⌘8", descKey: "switchEditMode" },
            { hotkey: "⌘A", descKey: "selectAllCodeBlock" },
            { hotkey: "Esc", descKey: "closePopup" },
        ],
    },
];

const KBD_STYLE = "border:1px solid rgba(128,128,128,.45);border-radius:3px;"
    + "padding:0 5px;font-size:12px;font-family:var(--vditor-font-mono, monospace);"
    + "display:inline-block;line-height:17px;margin:1px 2px 1px 0;";

const kbdHtml = (hotkey: string): string =>
    `<kbd style="${KBD_STYLE}">${updateHotkeyTip(hotkey)}</kbd>`;

const hotkeyCellHtml = (entry: IHotkeyDocEntry): string =>
    entry.hotkey.split(" · ").map((part) => {
        const range = part.split(" ~ ");
        return range.length === 2
            ? `${kbdHtml(range[0])} ~ ${kbdHtml(range[1])}`
            : kbdHtml(part);
    }).join(" ");

const entryHtml = (entry: IHotkeyDocEntry): string =>
    `<tr><td style="padding:2px 14px 2px 0;white-space:nowrap;">${
        hotkeyCellHtml(entry)}</td>` +
    `<td style="padding:2px 0;">${window.VditorI18n[entry.descKey] ?? entry.descKey}</td></tr>`;

/** 渲染快捷键说明面板 HTML(供工具栏下拉面板展示) */
export const renderHotkeyDocHtml = (): string => {
    const groups = HOTKEY_DOC_GROUPS.map((group) => `
<div style="margin: 12px 0 4px;font-weight:600;">${window.VditorI18n[group.titleKey] ?? group.titleKey}</div>
<table style="border-collapse:collapse;font-size:13px;line-height:20px;">${
        group.entries.map(entryHtml).join("")}</table>`).join("");
    const tip = window.VditorI18n.hotkeysCustomTip
        ? `<div style="margin-top:14px;color:var(--toolbar-icon-color, #888);font-size:12px;">${
            window.VditorI18n.hotkeysCustomTip}</div>` : "";
    return `<div style="max-height:min(70vh, 560px);overflow:auto;padding:4px 14px 10px;font-size:14px;line-height:22px;text-align:left;">${groups}${tip}</div>`;
};
