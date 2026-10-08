/**
 * 生成 issue-593 复现数据: 含内部跳转链接与外部 URI 链接的 PDF
 *
 * 上游 issue #593: 浏览 PDF 时, 指向文件内部位置(另一目录/书签)的链接
 * 可识别但点击不跳转, 外部网页链接无法识别。
 * 本脚本用 pdf-lib 生成 3 页 A4 PDF:
 * - 第 1 页: 两个内部 GoTo 链接注记(/Dest -> 第 2/3 页顶部) + 一个外部 URI 链接;
 * - 第 2/3 页: 各含一个返回第 1 页的内部链接 + 一个外部 URI 链接;
 * - 文档级 /Outlines 书签 3 项分别指向三页, 并设置 /PageMode /UseOutlines。
 * 运行: node test-workspace/_generate/issue_593_link_navigation.mjs
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = path.resolve(ROOT, '..');
const { PDFDocument, StandardFonts, rgb, PDFName, PDFString } = require(path.join(PKG, 'node_modules', 'pdf-lib'));

const OUT = path.join(ROOT, 'pdf', 'test-pdf-cweijan-593-link-navigation.pdf');
const A4 = [595.28, 841.89];
const BLUE = rgb(0.13, 0.36, 0.88);
const BLACK = rgb(0.1, 0.1, 0.1);
const TOP_Y = 800;

/** 画一段带下划线的链接文字, 返回对应注释矩形 [x1, y1, x2, y2] */
const drawLink = (page, font, text, x, y, size = 12) => {
    page.drawText(text, { x, y, size, font, color: BLUE });
    const w = font.widthOfTextAtSize(text, size);
    page.drawLine({ start: { x, y: y - 2 }, end: { x: x + w, y: y - 2 }, thickness: 1, color: BLUE });
    return [x - 2, y - 2, x + w + 2, y + size + 2];
};

/** 内部跳转链接注记(GoTo, /Dest 指向目标页顶部) */
const internalAnnot = (targetPage, rect, top = TOP_Y) => ({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: rect,
    Border: [0, 0, 0],
    Dest: [targetPage.ref, 'XYZ', null, top, null],
});

/** 外部 URI 链接注记 */
const externalAnnot = (url, rect) => ({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: rect,
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
});

async function main() {
    const doc = await PDFDocument.create();
    doc.setTitle('PDF Link Navigation Test (issue #593)');
    doc.setAuthor('Office Viewer Enhance');
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const p1 = doc.addPage(A4);
    const p2 = doc.addPage(A4);
    const p3 = doc.addPage(A4);

    // ---- 第 1 页: 内部跳转 + 外部链接 ----
    p1.drawText('PDF Link Navigation Test (issue #593)', { x: 60, y: 760, size: 20, font: bold, color: BLACK });
    p1.drawText('Blue underlined texts below are clickable link annotations.', { x: 60, y: 730, size: 11, font, color: BLACK });
    const p1Links = [];
    p1Links.push(internalAnnot(p2, drawLink(p1, font, 'Goto Page 2 (internal link)', 60, 640)));
    p1Links.push(internalAnnot(p3, drawLink(p1, font, 'Goto Page 3 (internal link)', 60, 600)));
    p1Links.push(externalAnnot('https://github.com/cweijan/vscode-office', drawLink(p1, font, 'Open GitHub repo (external URI link)', 60, 560)));
    p1.node.set(PDFName.of('Annots'), doc.context.obj(p1Links.map((a) => doc.context.register(doc.context.obj(a)))));

    // ---- 第 2 页 ----
    p2.drawText('Page 2 - internal link target', { x: 60, y: 760, size: 18, font: bold, color: BLACK });
    const p2Links = [];
    p2Links.push(internalAnnot(p1, drawLink(p2, font, 'Back to Page 1 (internal link)', 60, 700)));
    p2Links.push(externalAnnot('https://code.visualstudio.com/', drawLink(p2, font, 'Open VS Code site (external URI link)', 60, 660)));
    p2.node.set(PDFName.of('Annots'), doc.context.obj(p2Links.map((a) => doc.context.register(doc.context.obj(a)))));

    // ---- 第 3 页 ----
    p3.drawText('Page 3 - internal link target', { x: 60, y: 760, size: 18, font: bold, color: BLACK });
    const p3Links = [];
    p3Links.push(internalAnnot(p1, drawLink(p3, font, 'Back to Page 1 (internal link)', 60, 700)));
    p3Links.push(externalAnnot('https://github.com/microsoft/vscode', drawLink(p3, font, 'Open vscode repo (external URI link)', 60, 660)));
    p3.node.set(PDFName.of('Annots'), doc.context.obj(p3Links.map((a) => doc.context.register(doc.context.obj(a)))));

    // ---- 文档级书签(/Outlines), 打开时显示书签面板(/PageMode /UseOutlines) ----
    const outlineRef = doc.context.register(doc.context.obj({ Type: 'Outlines' }));
    const pages = [p1, p2, p3];
    const titles = ['Page 1 - Links', 'Page 2 - Target', 'Page 3 - Target'];
    const itemDicts = titles.map((t, i) => doc.context.obj({
        Title: PDFString.of(t),
        Parent: outlineRef,
        Dest: [pages[i].ref, 'XYZ', null, TOP_Y, null],
    }));
    const itemRefs = itemDicts.map((d) => doc.context.register(d));
    itemDicts.forEach((d, i) => {
        if (i > 0) d.set(PDFName.of('Prev'), itemRefs[i - 1]);
        if (i < itemRefs.length - 1) d.set(PDFName.of('Next'), itemRefs[i + 1]);
    });
    const outline = doc.context.lookup(outlineRef);
    outline.set(PDFName.of('First'), itemRefs[0]);
    outline.set(PDFName.of('Last'), itemRefs[itemRefs.length - 1]);
    outline.set(PDFName.of('Count'), doc.context.obj(itemRefs.length));
    doc.catalog.set(PDFName.of('Outlines'), outlineRef);
    doc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));

    const bytes = await doc.save();
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, bytes);
    console.log('生成:', OUT);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
