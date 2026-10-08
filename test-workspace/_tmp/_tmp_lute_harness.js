/* Lute probes with VditorWYSIWYG flag set (as the editor does) */
const path = require("path");
require(path.resolve(__dirname, "../vditor/dist/js/lute/lute.min.js"));
const Lute = globalThis.Lute;

function makeLute() {
    const lute = Lute.New();
    lute.SetVditorWYSIWYG(true);
    lute.SetVditorIR(false);
    lute.SetInlineMathAllowDigitAfterOpenMarker(true);
    lute.SetAutoSpace(false);
    lute.SetToC(false);
    lute.SetFootnotes(true);
    lute.SetFixTermTypo(false);
    lute.SetVditorCodeBlockPreview(true);
    lute.SetVditorMathBlockPreview(true);
    lute.SetSanitize(false);
    lute.SetChineseParagraphBeginningSpace(false);
    lute.SetRenderListStyle(true);
    lute.SetMark(true);
    return lute;
}
const lute = makeLute();
const show = (label, s) => console.log("== " + label + " ==\n" + JSON.stringify(s) + "\n");

const md226 = `按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制，按 <kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴。\n`;
const dom = lute.Md2VditorDOM(md226);
show("226 Md2VditorDOM(wysiwyg)", dom);
show("226 VditorDOM2Md(roundtrip)", lute.VditorDOM2Md(dom));
show("226 SpinVditorDOM(roundtrip)", lute.SpinVditorDOM(dom));

// simulate user typing a char in paragraph after the node (live-DOM shape):
const typed = dom.replace("粘贴。", "粘贴。X");
show("226 VditorDOM2Md(after typed)", lute.VditorDOM2Md(typed));

// paragraph where kbd at line start / alone
const md2 = `<kbd>Esc</kbd> 退出，按 <kbd>F5</kbd> 开始调试。\n`;
const dom2 = lute.Md2VditorDOM(md2);
show("226b Md2VditorDOM", dom2);
show("226b VditorDOM2Md", lute.VditorDOM2Md(dom2));

// what if raw <kbd> survives as literal HTML in DOM paragraph (not in span):
const rawHtml = `<p data-block="0">按 <kbd>Ctrl</kbd> 复制。</p>`;
show("226c VditorDOM2Md(raw kbd in p)", lute.VditorDOM2Md(rawHtml));

// 157 with wysiwyg flag
const md157 = `- 前置列表项\n- 包含表格的列表项：\n\n  | 名称   | 数量 | 备注   |\n  | ------ | ---- | ------ |\n  | item-a | 1    | first  |\n  | item-b | 2    | second |\n\n  hello\n- 后续列表项\n`;
const dom157 = lute.Md2VditorDOM(md157);
show("157 Md2VditorDOM(wysiwyg)", dom157);
show("157 VditorDOM2Md(roundtrip)", lute.VditorDOM2Md(dom157));
show("157 SpinVditorDOM(roundtrip)", lute.SpinVditorDOM(dom157));
