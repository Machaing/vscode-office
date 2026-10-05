import { getEventName } from "../util/compatibility";
import { renderHotkeyDocHtml } from "../util/hotkeyDoc";
import { MenuItem } from "./MenuItem";
import { hidePanel } from "./setToolbar";

/**
 * 工具栏「快捷键」下拉面板: 展示编辑器全量快捷键说明(数据源 hotkeyDoc.ts)。
 * 与 Headings 等工具栏面板一致的开关语义: 再次点击按钮或点击面板外部关闭。
 */
export class Hotkeys extends MenuItem {
    constructor(vditor: IVditor, menuItem: IMenuItem) {
        super(vditor, menuItem);

        const panelElement = document.createElement("div");
        // vditor-panel--left: 面板右缘对齐按钮、向左展开(按钮在工具栏右侧, 向右展开会截断)
        panelElement.className = "vditor-hint vditor-panel--arrow vditor-panel--left vditor-hotkeys-panel";
        panelElement.style.display = "none";
        panelElement.style.width = "min(600px, calc(100vw - 32px))";
        // 覆盖 .vditor-hint 默认 max-width: 250px(参照 Settings 面板的视口约束)
        panelElement.style.maxWidth = "min(600px, calc(100vw - 32px))";
        panelElement.style.marginTop = "6px";
        panelElement.innerHTML = renderHotkeyDocHtml();
        this.element.appendChild(panelElement);

        const actionBtn = this.element.children[0] as HTMLElement;
        actionBtn.addEventListener(getEventName(), (event) => {
            event.preventDefault();
            const visible = panelElement.style.display === "block";
            hidePanel(vditor, ["subToolbar", "hint"]);
            panelElement.style.display = visible ? "none" : "block";
        });

        document.addEventListener("mousedown", (event: Event) => {
            if (panelElement.style.display !== "block") {
                return;
            }
            const target = event.target as Node;
            if (!panelElement.contains(target) && !this.element.contains(target)) {
                panelElement.style.display = "none";
            }
        });
    }
}
