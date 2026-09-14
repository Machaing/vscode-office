import {hasClosestBlock} from "../util/hasClosest";
import {hasClosestByTag} from "../util/hasClosestByHeadings";
import {getEditorRange, setRangeByWbr} from "../util/selection";
import {renderTocNow} from "../util/toc";

export const setHeading = (vditor: IVditor, tagName: string) => {
    const range = getEditorRange(vditor);
    let blockElement = hasClosestBlock(range.startContainer);
    if (!blockElement) {
        blockElement = range.startContainer.childNodes[range.startOffset] as HTMLElement;
    }
    if (!blockElement && vditor.wysiwyg.element.children.length === 0) {
        blockElement = vditor.wysiwyg.element;
    }
    if (blockElement && !blockElement.classList.contains("vditor-wysiwyg__block")) {
        // 列表行转标题:hasClosestBlock 命中的是整个 OL/UL,直接整包替换会把列表塞进标题,
        // Lute 重组后序号丢失变为 `* `。需定位光标所在 li 仅转换该行,
        // 并把有序列表序号写入标题文本(issue#590)
        let headingPrefix = "";
        if (blockElement.tagName === "UL" || blockElement.tagName === "OL") {
            const liElement = hasClosestByTag(range.startContainer, "LI");
            if (liElement) {
                const listElement = liElement.parentElement;
                const marker = liElement.getAttribute("data-marker") ||
                    (listElement && listElement.getAttribute("data-marker")) || "";
                if (listElement && listElement.tagName === "OL" && marker) {
                    headingPrefix = `${marker} `;
                }
                liElement.querySelectorAll('input[type="checkbox"]').forEach((item) => {
                    // checkbox 后的空格属于列表标记,一并去掉,避免标题文本出现双空格
                    const next = item.nextSibling;
                    if (next && next.nodeType === 3 && next.textContent.startsWith(" ")) {
                        next.textContent = next.textContent.substring(1);
                        if (next.textContent === "") {
                            next.remove();
                        }
                    }
                    item.remove();
                });
                blockElement = liElement;
            }
        }
        range.insertNode(document.createElement("wbr"));
        // Firefox 需要 trim https://github.com/Vanessa219/vditor/issues/207
        if (blockElement.innerHTML.trim() === "<wbr>") {
            // Firefox 光标对不齐 https://github.com/Vanessa219/vditor/issues/199 1
            blockElement.innerHTML = "<wbr><br>";
        }
        const headingHTML =
            `<${tagName} data-block="0">${headingPrefix}${blockElement.innerHTML.trim()}</${tagName}>`;
        if (blockElement.tagName === "BLOCKQUOTE" || blockElement.classList.contains("vditor-reset")) {
            blockElement.innerHTML = headingHTML;
        } else {
            blockElement.outerHTML = headingHTML;
        }
        setRangeByWbr(vditor.wysiwyg.element, range);
        renderTocNow(vditor);
    }
};

export const removeHeading = (vditor: IVditor) => {
    const range = getSelection().getRangeAt(0);
    let blockElement = hasClosestBlock(range.startContainer);
    if (!blockElement) {
        blockElement = range.startContainer.childNodes[range.startOffset] as HTMLElement;
    }
    if (blockElement) {
        range.insertNode(document.createElement("wbr"));
        blockElement.outerHTML = `<p data-block="0">${blockElement.innerHTML}</p>`;
        setRangeByWbr(vditor.wysiwyg.element, range);
    }
    vditor.wysiwyg.popover.style.display = "none";
};
