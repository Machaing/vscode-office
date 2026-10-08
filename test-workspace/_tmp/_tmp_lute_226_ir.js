/* 226 + 157 in IR mode */
const path = require("path");
require(path.resolve(__dirname, "../vditor/dist/js/lute/lute.min.js"));
const Lute = globalThis.Lute;

function makeLute(ir) {
    const lute = Lute.New();
    lute.SetVditorWYSIWYG(!ir);
    lute.SetVditorIR(!!ir);
    lute.SetFootnotes(true);
    lute.SetRenderListStyle(true);
    lute.SetMark(true);
    lute.SetInlineMathAllowDigitAfterOpenMarker(true);
    return lute;
}
const show = (label, s) => console.log("== " + label + " ==\n" + JSON.stringify(s) + "\n");

const ir = makeLute(true);
const md226 = `按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制。\n`;
const dom = ir.Md2VditorIRDOM(md226);
show("IR Md2VditorIRDOM", dom);
show("IR VditorIRDOM2Md", ir.VditorIRDOM2Md(dom));
show("IR SpinVditorIRDOM", ir.SpinVditorIRDOM(dom));

// 157 in IR
const md157 = `- 前置\n- 表格项：\n\n  | a | b |\n  | - | - |\n  | 1 | 2 |\n\n  hello\n- 后续\n`;
const dom157 = ir.Md2VditorIRDOM(md157);
show("IR 157 dom", dom157);
show("IR 157 roundtrip", ir.VditorIRDOM2Md(dom157));
show("IR 157 spin", ir.SpinVditorIRDOM(dom157));
