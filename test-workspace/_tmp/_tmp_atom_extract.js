/* Search A assignment after Lookup too */
const fs = require("fs");
const s = fs.readFileSync("e:/Project-mzy/code/vscode-office/vditor/src/js/lute/lute.min.js", "utf8");
const blobEndAnchor = '",(a>>>8>>>0),((a>>>8>>>0)+((a&255)>>>0)>>>0));};$ptrType(B).prototype.string';
const ai = s.indexOf(blobEndAnchor);
// package extends to $pkg.Lookup / $pkg.String assignments; find them
const pkgEnd = s.indexOf("$pkg.String=", ai);
console.log("pkg.String at", pkgEnd);
const seg = s.slice(ai, pkgEnd + 5000);
const am = seg.match(/A=(\$toNativeArray\([^,]+,)?\[([\d,]+)\]/);
console.log("A after:", !!am);
if (am) {
  const A = JSON.parse("[" + am[2] + "]");
  console.log("A len", A.length);
  // blob
  let start = -1;
  for (let j = ai - 1; j > ai - 30000; j--) {
    if (s[j] === '"' && s[j - 1] !== "\\") { start = j + 1; break; }
  }
  const blob = s.slice(start, ai);
  function lookup(str) {
    let a = 2177757454 >>> 0;
    for (let i = 0; i < str.length; i++) {
      a = (a ^ str.charCodeAt(i)) >>> 0;
      a = Math.imul(a, 16777619) >>> 0;
    }
    for (const idx of [(a & 511) >>> 0, ((a >>> 16) & 511) >>> 0]) {
      const v = A[idx];
      if (v !== 0 && (v & 255) === str.length && blob.slice(v >>> 8, (v >>> 8) + (v & 255)) === str) return v;
    }
    return 0;
  }
  for (const t of ["table", "thead", "tbody", "td", "tr", "p", "ul", "ol", "div", "blockquote", "pre", "li", "em", "strong"]) {
    console.log(t, "->", lookup(t));
  }
} else {
  // print tail of seg for inspection
  console.log(JSON.stringify(seg.slice(-1500)));
}
