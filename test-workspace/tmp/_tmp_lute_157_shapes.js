/* 157: test alternate document shapes through Md->DOM->Md and spin roundtrips */
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

// shape 1: li starts with table directly
const md1 = `- 前置\n- 表格项：\n\n  | a | b |\n  | - | - |\n  | 1 | 2 |\n\n  hello\n- 后续\n`;
const dom1 = lute.Md2VditorDOM(md1);
show("shape1 md", md1);
show("shape1 dom", dom1);
show("shape1 roundtrip", lute.VditorDOM2Md(dom1));

// shape 2: table ends the li (no hello), blank line before next item
const md2 = `- 前置\n- 表格项：\n\n  | a | b |\n  | - | - |\n  | 1 | 2 |\n\n- 后续\n`;
const dom2 = lute.Md2VditorDOM(md2);
show("shape2 dom", dom2);
show("shape2 roundtrip", lute.VditorDOM2Md(dom2));

// shape 3: ordered list
const md3 = `1. 前置\n2. 表格项：\n\n   | a | b |\n   | - | - |\n   | 1 | 2 |\n\n   hello\n3. 后续\n`;
const dom3 = lute.Md2VditorDOM(md3);
show("shape3 roundtrip", lute.VditorDOM2Md(dom3));

// shape 4: tight variant — hello without blank line before it
const md4 = `- 前置\n- 表格项：\n\n  | a | b |\n  | - | - |\n  | 1 | 2 |\n  hello\n- 后续\n`;
const dom4 = lute.Md2VditorDOM(md4);
show("shape4 dom", dom4);
show("shape4 roundtrip", lute.VditorDOM2Md(dom4));

// shape 5: spin of dom1 with wbr in cell (live edit simulation)
const edited1 = dom1.replace("<td>2</td>", "<td>3<wbr></td>");
show("shape5 spin(edited)", lute.SpinVditorDOM(edited1));
show("shape5 md", lute.VditorDOM2Md(lute.SpinVditorDOM(edited1)));

// shape 6: what if the li content after table loses its <p> (bare text in li)?
const tightDom = dom1.replace("<p data-block=\"0\">hello</p>", "hello");
show("shape6 VditorDOM2Md(bare hello)", lute.VditorDOM2Md(tightDom));

// shape 7: markdown indent 4 spaces for table
const md7 = `- 前置\n- 表格项：\n\n    | a | b |\n    | - | - |\n    | 1 | 2 |\n\n    hello\n- 后续\n`;
const dom7 = lute.Md2VditorDOM(md7);
show("shape7 dom", dom7);
show("shape7 roundtrip", lute.VditorDOM2Md(dom7));
