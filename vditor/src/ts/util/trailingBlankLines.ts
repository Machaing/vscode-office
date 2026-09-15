import {Constants} from "../constants";

/**
 * 结尾空行保真（cweijan/vscode-office#601）
 *
 * Lute 的 Md2VditorDOM / Md2VditorIRDOM 会丢弃 markdown 结尾的全部空行，
 * VditorDOM2Md / VditorIRDOM2Md 又会把结尾空段落折叠成单个 `\n`，
 * 导致「打开→显示→同步/保存」round-trip 中文件尾部空行丢失
 * （用户在底部输入 N 个换行后，任何一次重新渲染都会吞掉这些空行）。
 *
 * 这里在 DOM 层补足表达：
 * - 渲染方向：markdown 结尾的 T 个 LF 还原为 T-1 个结尾空段落（`<p>​</p>`）；
 * - 序列化方向：Lute 输出恒以单个 `\n` 结尾，再按结尾空段落数量补齐对应的 `\n`。
 */

export const BOUNDARY_SENTINEL_CLASS = "vditor-editor-boundary";

const isIgnoredInlineNode = (node: Element): boolean => {
    return node.tagName === "BR" || node.tagName === "WBR";
};

/** 结尾空段落：仅含 ZWSP/空白文本，子元素只有 br/wbr 的顶层 `<p>` */
const isBlankParagraph = (element: Element): boolean => {
    if (element.tagName !== "P") {
        return false;
    }
    for (const child of Array.from(element.children)) {
        if (!isIgnoredInlineNode(child)) {
            return false;
        }
    }
    return element.textContent.replace(Constants.ZWSP, "").trim() === "";
};

/** 统计编辑器顶层结尾的空段落数量（跳过边界哨兵 span） */
export const countTrailingBlankParagraphs = (editorElement: HTMLElement): number => {
    let count = 0;
    const children = editorElement.children;
    for (let i = children.length - 1; i >= 0; i--) {
        const element = children[i];
        if (element.classList.contains(BOUNDARY_SENTINEL_CLASS)) {
            continue;
        }
        if (!isBlankParagraph(element)) {
            break;
        }
        count++;
    }
    return count;
};

/** 统计 markdown 结尾连续 LF 的数量 */
export const countTrailingNewlines = (markdown: string): number => {
    let count = 0;
    for (let i = markdown.length - 1; i >= 0; i--) {
        if (markdown.charCodeAt(i) !== 10) {
            break;
        }
        count++;
    }
    return count;
};

/** 渲染方向：按 markdown 结尾空行数补齐结尾空段落（需在边界哨兵插入前调用） */
export const appendTrailingBlankParagraphs = (editorElement: HTMLElement, markdown: string) => {
    const blankCount = Math.max(countTrailingNewlines(markdown) - 1, 0);
    if (blankCount <= 0) {
        return;
    }
    editorElement.insertAdjacentHTML(
        "beforeend",
        `<p data-block="0">${Constants.ZWSP}</p>`.repeat(blankCount),
    );
};

/** 序列化方向：Lute 输出已含 1 个结尾 `\n`，按结尾空段落补齐其余 `\n` */
export const withTrailingNewlinesFromDom = (markdown: string, editorElement: HTMLElement): string => {
    if (!markdown.endsWith("\n")) {
        return markdown;
    }
    const count = countTrailingBlankParagraphs(editorElement);
    return count > 0 ? markdown + "\n".repeat(count) : markdown;
};
