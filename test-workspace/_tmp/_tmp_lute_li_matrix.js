/* Lute li-children serialization matrix */
const path = require("path");
require(path.resolve(__dirname, "../vditor/dist/js/lute/lute.min.js"));
const Lute = globalThis.Lute;

const lute = Lute.New();
lute.SetVditorWYSIWYG(true);
lute.SetVditorIR(false);
lute.SetFootnotes(true);
lute.SetRenderListStyle(true);

const T = '<table data-block="0"><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
const P = (t) => `<p data-block="0">${t}</p>`;
const li = (inner) => `<li data-marker="-">${inner}</li>`;
const ul = (inner, tight) => `<ul data-marker="-" data-block="0"${tight ? ' data-tight="true"' : ''}>${inner}</li>`.replace("</li>", "></ul>");
const ul2 = (inner, tight) => `<ul data-marker="-" data-block="0"${tight ? ' data-tight="true"' : ''}>${inner}</ul>`;

const cases = {
  "[p]": ul2(li(P("x"))),
  "[p,table] loose-marked": ul2(li(P("x") + T)),
  "[p,table] tight-marked": ul2(li(P("x") + T), true),
  "[table,p]": ul2(li(T + P("x"))),
  "[table]": ul2(li(T)),
  "[p,table,p]": ul2(li(P("x") + T + P("y"))),
  "[text,table] tight": ul2(li("x" + T), true),
  "[text,table] noattr": ul2(li("x" + T)),
  "[p,p]": ul2(li(P("x") + P("y"))),
  "[p,blockquote]": ul2(li(P("x") + `<blockquote data-block="0">${P("q")}</blockquote>`)),
  "[p,nested-ul]": ul2(li(P("x") + ul2(li(P("n"))))),
};

for (const [k, dom] of Object.entries(cases)) {
  console.log("== " + k + " ==");
  console.log("in : " + dom);
  console.log("md : " + JSON.stringify(lute.VditorDOM2Md(dom)));
  console.log();
}

// what happens if we wrap bare text in p before VditorDOM2Md (candidate fix for Bug B)
const bareTight = ul2(li("x" + T), true);
const wrapped = ul2(li(P("x") + T), true);
console.log("fix check [text→p, table] tight-marked:", JSON.stringify(lute.VditorDOM2Md(wrapped)));
