/* Which inline elements does HTML2VditorDOM (paste path) preserve? */
const path = require("path");
require(path.resolve(__dirname, "../vditor/dist/js/lute/lute.min.js"));
const Lute = globalThis.Lute;

const lute = Lute.New();
lute.SetVditorWYSIWYG(true);
lute.SetVditorIR(false);

const tags = ["kbd", "u", "sub", "sup", "mark", "span", "small", "b", "i", "em", "strong",
  "samp", "var", "abbr", "cite", "q", "dfn", "big", "s", "del", "ins", "code", "br", "img"];
for (const tag of tags) {
  const html = `<p>前 <${tag}>X</${tag}> 后</p>`;
  const dom = lute.HTML2VditorDOM(html);
  const md = lute.VditorDOM2Md(dom);
  const kept = md.includes(`<${tag}>X</${tag}>`) || md.includes(`<${tag}`);
  console.log(tag.padEnd(7), kept ? "KEPT" : "DROPPED", JSON.stringify(md.trim()));
}
