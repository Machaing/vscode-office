import {buildEditorHtmlForMarkdown} from "../codeBlock/codeMirrorManager";
import {normalizeHtmlInlineForSerialize} from "./htmlInlineRoundtrip";
import {formatMs, logPerf} from "../util/log";
import {withTrailingNewlinesFromDom} from "../util/trailingBlankLines";

export const getMarkdown = (vditor: IVditor) => {
    const debug = vditor.options.debugger;
    const totalStart = debug ? performance.now() : 0;

    let stepStart = debug ? performance.now() : 0;
    const html = buildEditorHtmlForMarkdown(vditor);
    const buildHtmlMs = debug ? performance.now() - stepStart : 0;

    stepStart = debug ? performance.now() : 0;
    // issue cweijan-226: 行内 HTML 的分离形态 html-inline span 需先合并为
    // 「单 span + 完整 data-md-source」,否则 Lute 序列化时标签全部丢失
    const normalizedHtml = normalizeHtmlInlineForSerialize(html, vditor);
    const normalizeMs = debug ? performance.now() - stepStart : 0;

    stepStart = debug ? performance.now() : 0;
    let markdown = "";
    if (vditor.currentMode === "wysiwyg") {
        markdown = vditor.lute.VditorDOM2Md(normalizedHtml);
    } else if (vditor.currentMode === "ir") {
        markdown = vditor.lute.VditorIRDOM2Md(normalizedHtml);
    }
    const editorElement = vditor.currentMode === "wysiwyg" ? vditor.wysiwyg.element
        : vditor.currentMode === "ir" ? vditor.ir.element : undefined;
    if (editorElement) {
        // 结尾空段落无法被 Lute 序列化，这里按 DOM 补齐结尾 `\n`
        markdown = withTrailingNewlinesFromDom(markdown, editorElement);
    }
    const toMarkdownMs = debug ? performance.now() - stepStart : 0;

    logPerf(debug, "[vditor markdown] getMarkdown", {
        buildHtmlMs: formatMs(buildHtmlMs),
        normalizeMs: formatMs(normalizeMs),
        toMarkdownMs: formatMs(toMarkdownMs),
        totalMs: formatMs(debug ? performance.now() - totalStart : 0),
    });

    return markdown;
};
