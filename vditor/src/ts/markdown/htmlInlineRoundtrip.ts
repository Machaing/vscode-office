/**
 * issue cweijan-226: Lute 渲染端(Md2VditorDOM/Md2VditorIRDOM)会把 <kbd>/<mark>/
 * <span style>/<br>/<img> 等行内 HTML 渲染成 data-type="html-inline" 的只读 span,
 * 标签源码存于 data-md-source 属性,并按「开标签 span + 裸内容 + 闭标签 span」的
 * 分离形态输出;而序列化端(VditorDOM2Md/VditorIRDOM2Md)只能还原「单 span +
 * 完整 data-md-source」形态。分离形态往返时标签直接丢失,带属性的标签(<span
 * style>)与 void 标签(<br>/<img>)连内容一起丢(标签在 display 内未闭合,
 * 浏览器解析时吞并相邻内容)。
 *
 * 本模块在 getMarkdown 序列化前把编辑器 DOM 快照中的分离形态重写为可还原形态:
 * 栈式由内向外将「开标签 span ... 闭标签 span」合并为单 span,data-md-source
 * 拼合为完整标签对;void/自闭合/完整对形态仅重写 class 引导 Lute 走单节点还原;
 * 无法配对的残缺 span 退化为字面文本,保证内容不丢。仅作用于序列化用的 detached
 * 副本,不影响编辑器内的实际渲染与交互。
 */

const VOID_TAGS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
]);

const OPEN_TAG = /^<([a-zA-Z][\w-]*)\b/;
const CLOSE_TAG = /^<\/\s*([a-zA-Z][\w-]*)\s*>$/;
const FULL_PAIR = /^<([a-zA-Z][\w-]*)\b[^>]*>[\s\S]*<\/\s*\1\s*>$/;

/** Lute 渲染端产出的原始 html-inline span(class 含 vditor-html-inline) */
const isRawHtmlInline = (el: Element): boolean =>
    el.getAttribute("data-type") === "html-inline" &&
    (el.getAttribute("class") || "").indexOf("vditor-html-inline") > -1;

/** 合并/重写后的可还原 span(序列化时 Lute 只读其完整 data-md-source) */
const isMergedHtmlInline = (el: Element): boolean =>
    el.getAttribute("data-type") === "html-inline" &&
    (el.getAttribute("class") || "").indexOf("vditor-html-inline") === -1;

const mdSourceOf = (el: Element): string => el.getAttribute("data-md-source") || "";

const isSelfContained = (src: string): boolean => {
    const open = src.match(OPEN_TAG);
    if (!open) {
        return false;
    }
    return /\/\s*>$/.test(src) || VOID_TAGS.has(open[1].toLowerCase());
};

/** 渲染元素节点转回 markdown(借 Lute 序列化其标准渲染形态) */
const domToMd = (el: Element, vditor: IVditor): string => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<p data-block="0">${el.outerHTML}</p>`;
    const md = vditor.currentMode === "ir"
        ? vditor.lute.VditorIRDOM2Md(wrap.innerHTML)
        : vditor.lute.VditorDOM2Md(wrap.innerHTML);
    return md.replace(/\n+$/, "");
};

/** 逐节点生成 markdown 源码:文本直取、已合并 span 取 data-md-source、渲染元素转 md */
const fragmentToMd = (nodes: Node[], vditor: IVditor): string => {
    let out = "";
    for (const node of nodes) {
        if (node.nodeType === 3) {
            out += node.nodeValue || "";
            continue;
        }
        if (node.nodeType !== 1) {
            continue;
        }
        const el = node as Element;
        if (isMergedHtmlInline(el)) {
            out += mdSourceOf(el);
            continue;
        }
        if (isRawHtmlInline(el)) {
            // 残缺(未配对)的原始 span:退化为字面标签 + display 中的可见文本
            out += mdSourceOf(el) + (el.textContent || "");
            continue;
        }
        if (!el.firstChild) {
            // 浏览器解析未闭合标签留下的空元素(display 内 <kbd> 等),无源码对应
            continue;
        }
        out += domToMd(el, vditor);
    }
    return out;
};

const removeNode = (node: Node) => {
    node.parentNode?.removeChild(node);
};

/** 将节点替换为字面文本,保证残缺标签的字面内容落盘 */
const replaceWithLiteral = (el: Element) => {
    const text = mdSourceOf(el) + (el.textContent || "");
    el.parentNode?.replaceChild(document.createTextNode(text), el);
};

/** 原地合并一个配对:openSpan 吸收中间节点与闭标签,写入完整 data-md-source */
const mergePair = (
    openSpan: HTMLElement,
    openSrc: string,
    middleNodes: Node[],
    closeSpan: Element,
    closeSrc: string,
    vditor: IVditor,
) => {
    // display 是开标签的显示层:浏览器解析未闭合标签时可能把后续内容吞入其中
    const display = openSpan.querySelector(":scope > .vditor-html-inline__display");
    const displayNodes = display ? Array.from(display.childNodes) : [];

    const innerMd = fragmentToMd(displayNodes, vditor) + fragmentToMd(middleNodes, vditor);
    openSpan.setAttribute("data-md-source", openSrc + innerMd + closeSrc);
    openSpan.setAttribute("class", "vditor-ir__node");
    openSpan.removeAttribute("contenteditable");

    for (const child of Array.from(openSpan.childNodes)) {
        removeNode(child);
    }
    // 中间节点移入保留(序列化被忽略,仅供留痕),闭标签移除
    for (const node of middleNodes) {
        openSpan.appendChild(node);
    }
    removeNode(closeSpan);
};

/** 就地重写自包含形态(void/自闭合/完整对):只需引导 Lute 走单节点还原 */
const rewriteSelfContained = (span: HTMLElement) => {
    const display = span.querySelector(":scope > .vditor-html-inline__display");
    if (display) {
        removeNode(display);
    }
    span.setAttribute("class", "vditor-ir__node");
    span.removeAttribute("contenteditable");
};

/** 处理一段兄弟序列:栈式配对开/闭标签 span,由内向外合并 */
const processSequence = (parent: Element, vditor: IVditor) => {
    const stack: { el: HTMLElement; tag: string; src: string }[] = [];
    for (const node of Array.from(parent.childNodes)) {
        if (!node.parentNode) {
            // 已被先前的合并消化(移入 openSpan 或移除)
            continue;
        }
        if (node.nodeType !== 1 || !isRawHtmlInline(node as Element)) {
            continue;
        }
        const span = node as HTMLElement;
        const src = mdSourceOf(span);
        const closeMatch = src.match(CLOSE_TAG);
        if (closeMatch) {
            const tag = closeMatch[1].toLowerCase();
            let index = -1;
            for (let i = stack.length - 1; i >= 0; i--) {
                if (stack[i].tag === tag) {
                    index = i;
                    break;
                }
            }
            if (index === -1) {
                replaceWithLiteral(span);
                continue;
            }
            // 配对点之上未配对的开标签退化为字面量(并入中间内容)
            for (let i = stack.length - 1; i > index; i--) {
                replaceWithLiteral(stack[i].el);
                stack.pop();
            }
            const open = stack.pop()!;
            const middleNodes: Node[] = [];
            let cursor: Node | null = open.el.nextSibling;
            while (cursor && cursor !== span) {
                const next: Node | null = cursor.nextSibling;
                middleNodes.push(cursor);
                cursor = next;
            }
            mergePair(open.el, open.src, middleNodes, span, src, vditor);
            continue;
        }
        if (OPEN_TAG.test(src) && !isSelfContained(src) && !FULL_PAIR.test(src)) {
            stack.push({ el: span, tag: src.match(OPEN_TAG)![1].toLowerCase(), src });
            continue;
        }
        rewriteSelfContained(span);
    }
    // 段内未闭合的开标签:字面量化兜底
    for (const item of stack) {
        if (item.el.parentNode) {
            replaceWithLiteral(item.el);
        }
    }
};

/**
 * 序列化前的 html-inline 规范化:html 为编辑器 DOM 的 innerHTML 快照,
 * 返回重写后的 innerHTML,供 VditorDOM2Md/VditorIRDOM2Md 消费。
 */
export const normalizeHtmlInlineForSerialize = (html: string, vditor: IVditor): string => {
    if (!html || html.indexOf('data-type="html-inline"') === -1) {
        return html;
    }
    const root = document.createElement("div");
    root.innerHTML = html;
    const parents = new Set<Element>();
    for (const span of Array.from(root.querySelectorAll('span[data-type="html-inline"]'))) {
        const parent = span.parentElement;
        if (parent) {
            parents.add(parent);
        }
    }
    for (const parent of parents) {
        if (parent.isConnected || root.contains(parent)) {
            processSequence(parent, vditor);
        }
    }
    return root.innerHTML;
};
