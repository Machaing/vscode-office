const path = require("path");
require(path.resolve(__dirname, "../vditor/dist/js/lute/lute.min.js"));
const Lute = globalThis.Lute;
console.log("Lute static:", Object.getOwnPropertyNames(Lute).join(", "));
const lute = Lute.New();
let names = [];
for (let k in lute) { names.push(k); }
console.log("instance for-in:", names.join(", "));
try {
    names = Object.getOwnPropertyNames(Object.getPrototypeOf(lute));
    console.log("proto:", names.join(", "));
} catch (e) { console.log("proto err", e.message); }
// GopherJS objects store methods on the object itself after first access
for (const n of ["SpinVditorDOM", "Md2VditorDOM", "VditorDOM2Md", "Md2VditorIRDOM", "VditorIRDOM2Md", "SpinVditorIRDOM"]) {
    console.log(n, typeof lute[n]);
}
