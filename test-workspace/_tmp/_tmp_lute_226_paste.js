/* 226: HTML2VditorDOM (paste path) and real-element kbd handling */
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

// paste path: real <kbd> elements in html
const html = `<p>按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制。</p>`;
const dom = lute.HTML2VditorDOM(html);
show("HTML2VditorDOM(kbd elements)", dom);
show("VditorDOM2Md of that", lute.VditorDOM2Md(dom));

// real kbd element directly in wysiwyg DOM paragraph (element, not span wrapper)
const realEl = `<p data-block="0">按 <kbd data-block="0">Ctrl</kbd> 复制。</p>`;
show("VditorDOM2Md(real kbd element)", lute.VditorDOM2Md(realEl));
show("SpinVditorDOM(real kbd element)", lute.SpinVditorDOM(realEl));

// other inline tags
for (const tag of ["u", "sub", "sup", "mark", "span", "small", "b"]) {
    const md = `文字 <${tag}>内容</${tag}> 结尾\n`;
    const d = lute.Md2VditorDOM(md);
    const back = lute.VditorDOM2Md(d);
    console.log(`tag <${tag}>: roundtrip ${back === md ? "OK" : "CHANGED"} -> ${JSON.stringify(back)}`);
}

// what about kbd inside a list item?
const mdl = `- 列表 <kbd>Ctrl</kbd> 内容\n`;
show("list kbd roundtrip", lute.VditorDOM2Md(lute.Md2VditorDOM(mdl)));

// code fence containing kbd (must not be touched)
const mdc = "```\n<kbd>Ctrl</kbd>\n```\n";
show("fence roundtrip", lute.VditorDOM2Md(lute.Md2VditorDOM(mdc)));

// inline code containing kbd literal
const mdi = "`<kbd>Ctrl</kbd>`\n";
show("inline-code roundtrip", lute.VditorDOM2Md(lute.Md2VditorDOM(mdi)));

// html block: div
const mdb = `<div class="x">block</div>\n`;
const db = lute.Md2VditorDOM(mdb);
show("html-block dom", db);
show("html-block roundtrip", lute.VditorDOM2Md(db));
