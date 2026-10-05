export const codicon = (name: string, className = "") =>
    `<span class="codicon codicon-${name}${className ? ` ${className}` : ""}" aria-hidden="true"></span>`;

/** codicon 无 undo，用 redo 水平镜像 */
export const codiconUndo = (className = "") =>
    `<span class="codicon codicon-redo vditor-codicon-undo${className ? ` ${className}` : ""}" aria-hidden="true"></span>`;

/** codicon 无 outdent，用 indent 水平镜像 */
export const codiconOutdent = (className = "") =>
    `<span class="codicon codicon-indent vditor-codicon-outdent${className ? ` ${className}` : ""}" aria-hidden="true"></span>`;

/** 键盘图标(快捷键面板入口): 内联 SVG, 不依赖 codicon 字体字形 */
export const codiconKeyboard = (className = "") =>
    `<span class="codicon${className ? ` ${className}` : ""}" aria-hidden="true">` +
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" ` +
    `style="display:inline-block;vertical-align:text-bottom;">` +
    `<path d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm0 9H2V4h12v8ZM4 6h1v1H4V6Zm2 0h1v1H6V6Zm2 0h1v1H8V6Zm2 0h1v1h-1V6Zm2 0h1v1h-1V6ZM4 8h1v1H4V8Zm2 0h1v1H6V8Zm2 0h1v1H8V8Zm2 0h1v1h-1V8Zm2 0h1v1h-1V8ZM5 10h6v1H5v-1Z"/></svg></span>`;

const TOOLBAR_CODICONS: Record<string, string> = {
    headings: "text-size",
    bold: "bold",
    italic: "italic",
    strike: "strikethrough",
    link: "link",
    list: "list-unordered",
    "ordered-list": "list-ordered",
    check: "tasklist",
    outdent: "__outdent__",
    indent: "indent",
    quote: "quote",
    line: "horizontal-rule",
    code: "code",
    "inline-code": "symbol-text",
    "insert-before": "arrow-up",
    "insert-after": "arrow-down",
    upload: "cloud-upload",
    table: "table",
    undo: "__undo__",
    redo: "redo",
    more: "ellipsis",
    "edit-mode": "edit",
    outline: "list-tree",
    "editor-theme": "color-mode",
    "code-theme": "file-code",
    "ai-settings": "sparkle",
    settings: "settings-gear",
    info: "info",
    help: "question",
    find: "search",
    hotkeys: "__keyboard__",
};

export const TABLE_CODICONS = {
    add: "add",
    alignLeft: "layout-panel-left",
    alignCenter: "layout-panel-center",
    alignRight: "layout-panel-right",
    insertRowBelow: "run-below",
    insertRowAbove: "run-above",
    insertColumnRight: "arrow-right",
    insertColumnLeft: "arrow-left",
    deleteRow: "trash",
    deleteColumn: "trash",
} as const;

export const getToolbarCodicon = (name: string): string => {
    const icon = TOOLBAR_CODICONS[name];
    if (icon === "__undo__") {
        return codiconUndo();
    }
    if (icon === "__outdent__") {
        return codiconOutdent();
    }
    if (icon === "__keyboard__") {
        return codiconKeyboard();
    }
    return icon ? codicon(icon) : "";
};
