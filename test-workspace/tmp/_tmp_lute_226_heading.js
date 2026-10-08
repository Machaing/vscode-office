/* 226: heading + html-inline roundtrip */
const path = require("path");
require(path.resolve(__dirname, "../vditor/dist/js/lute/lute.min.js"));
const Lute = globalThis.Lute;

function makeLute() {
    const lute = Lute.New();
    lute.SetVditorWYSIWYG(true);
    lute.SetVditorIR(false);
    lute.SetFootnotes(true);
    lute.SetRenderListStyle(true);
    lute.SetMark(true);
    lute.SetInlineMathAllowDigitAfterOpenMarker(true);
    return lute;
}
const lute = makeLute();
const show = (label, s) => console.log("== " + label + " ==\n" + JSON.stringify(s) + "\n");

const md = `# issue 226：<kbd> 标签保存后被自动加上反引号\n`;
const dom = lute.Md2VditorDOM(md);
show("Md2VditorDOM", dom);
show("VditorDOM2Md", lute.VditorDOM2Md(dom));
show("SpinVditorDOM", lute.SpinVditorDOM(dom));

// heading with kbd + text content
const md2 = `## 按 <kbd>Ctrl</kbd> 保存\n`;
const dom2 = lute.Md2VditorDOM(md2);
show("Md2VditorDOM2", dom2);
show("VditorDOM2Md2", lute.VditorDOM2Md(dom2));

// blockquote / bold contexts
const md3 = `> 引用 <kbd>Ctrl</kbd> 内容\n`;
const dom3 = lute.Md2VditorDOM(md3);
show("Md2VditorDOM3 (bq)", dom3);
show("VditorDOM2Md3", lute.VditorDOM2Md(dom3));

const md4 = `**加粗 <kbd>Ctrl</kbd> 结束**\n`;
const dom4 = lute.Md2VditorDOM(md4);
show("Md2VditorDOM4 (bold)", dom4);
show("VditorDOM2Md4", lute.VditorDOM2Md(dom4));

// table cell context
const md5 = `| 按键 | 说明 |\n| --- | --- |\n| <kbd>Ctrl</kbd> | 保存 |\n`;
const dom5 = lute.Md2VditorDOM(md5);
show("Md2VditorDOM5 (table)", dom5);
show("VditorDOM2Md5", lute.VditorDOM2Md(dom5));
