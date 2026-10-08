/**
 * 生成 Office Viewer 测试文档(Node 部分): pdf/psd/parquet/epub/xmind/archive/xls/ods
 * 运行: node test-workspace/_generate/generate.mjs
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { deflateSync, gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = path.resolve(ROOT, '..');
const JSZip = require(path.join(PKG, 'node_modules', 'jszip'));

function out(dir, name, data) {
	const d = path.join(ROOT, dir);
	mkdirSync(d, { recursive: true });
	const p = path.join(d, name);
	writeFileSync(p, data);
	return p;
}

/** 纯文本占位文件, 用于填充压缩包条目 */
const text = (s) => Buffer.from(s, 'utf-8');

// ---------------------------------------------------------------------------
// PDF (pdf-lib)
async function genPdf() {
	const { PDFDocument, StandardFonts, rgb, degrees } = require(path.join(PKG, 'node_modules', 'pdf-lib'));
	const doc = await PDFDocument.create();
	doc.setTitle('Office Viewer PDF 测试文档');
	doc.setAuthor('Office Viewer Enhance');
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const bold = await doc.embedFont(StandardFonts.HelveticaBold);

	const page = doc.addPage([595.28, 841.89]); // A4
	page.drawText('Office Viewer PDF Test', { x: 60, y: 760, size: 24, font: bold, color: rgb(0.26, 0.45, 0.95) });
	page.drawText('English text, formula x^2 + y^2 = r^2, (C) 2026', { x: 60, y: 720, size: 12, font });
	// 中文注: pdf-lib 标准字体不含 CJK, 画一个说明矩形代替
	page.drawRectangle({ x: 60, y: 640, width: 475, height: 50, color: rgb(0.95, 0.97, 1), borderColor: rgb(0.26, 0.45, 0.95), borderWidth: 1 });
	page.drawText('CJK text requires embedded fonts, skipped here.', { x: 72, y: 658, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
	// 折线图
	const series = [30, 80, 45, 120, 95, 160, 130];
	for (let i = 0; i < series.length - 1; i++) {
		page.drawLine({
			start: { x: 80 + i * 60, y: 300 + series[i] * 2 },
			end: { x: 80 + (i + 1) * 60, y: 300 + series[i + 1] * 2 },
			thickness: 2, color: rgb(0.86, 0.27, 0.22),
		});
	}
	series.forEach((v, i) => page.drawCircle({ x: 80 + i * 60, y: 300 + v * 2, size: 4, color: rgb(0.26, 0.45, 0.95) }));
	// 倾斜水印
	page.drawText('SAMPLE', { x: 150, y: 400, size: 90, font: bold, color: rgb(0.9, 0.9, 0.9), rotate: degrees(30) });

	const page2 = doc.addPage([595.28, 841.89]);
	page2.drawText('Page 2: multi-page navigation test', { x: 60, y: 760, size: 16, font: bold });
	const bytes = await doc.save();
	out('pdf', 'sample.pdf', bytes);
	console.log('pdf ok');
}

// ---------------------------------------------------------------------------
// PSD (手工构造无图层的未压缩 RGB PSD, ag-psd 可读)
function genPsd() {
	const w = 128, h = 128, channels = 3;
	const header = Buffer.alloc(26);
	header.write('8BPS', 0, 'ascii');
	header.writeUInt16BE(1, 4);            // version
	header.writeUInt32BE(0, 6);            // reserved (6 字节)
	header.writeUInt16BE(channels, 12);
	header.writeUInt32BE(h, 14);
	header.writeUInt32BE(w, 18);
	header.writeUInt16BE(8, 22);           // depth
	header.writeUInt16BE(3, 24);           // color mode: RGB
	const colorMode = Buffer.alloc(4);      // color mode data length = 0
	const resources = Buffer.alloc(4);      // image resources length = 0
	const layers = Buffer.alloc(4);         // layer and mask length = 0
	// 渐变像素, 逐通道平面排列 (planar)
	const r = Buffer.alloc(w * h), g = Buffer.alloc(w * h), b = Buffer.alloc(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			r[i] = (x * 255 / w) | 0;
			g[i] = (y * 255 / h) | 0;
			b[i] = ((x + y) * 255 / (w + h)) | 0;
		}
	}
	const compression = Buffer.alloc(2);
	compression.writeUInt16BE(0);           // raw
	out('psd', 'sample.psd', Buffer.concat([header, colorMode, resources, layers, compression, r, g, b]));
	console.log('psd ok');
}

// ---------------------------------------------------------------------------
// Parquet (hyparquet-writer)
async function genParquet() {
	const { parquetWriteBuffer } = require(path.join(PKG, 'node_modules', 'hyparquet-writer'));
	const buffer = parquetWriteBuffer({
		columnData: [
			{ name: 'month', type: 'BYTE_ARRAY', data: ['一月', '二月', '三月', '四月', '五月', '六月'] },
			{ name: 'sales', type: 'INT64', data: [1200n, 1350n, 1580n, 1490n, 1720n, 1655n] },
			{ name: 'price', type: 'DOUBLE', data: [45.5, 47.2, 44.8, 46.1, 48.9, 47.5] },
		],
	});
	out('parquet', 'sample.parquet', Buffer.from(buffer));
	console.log('parquet ok');
}

// ---------------------------------------------------------------------------
// EPUB (jszip 手工构造, mimetype 必须第一个且 STORE)
async function genEpub() {
	const zip = new JSZip();
	zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
	zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);
	zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:office-viewer-test-epub</dc:identifier>
    <dc:title>Office Viewer EPUB 测试图书</dc:title>
    <dc:creator>Office Viewer Enhance</dc:creator>
    <dc:language>zh-CN</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    <item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="c1"/><itemref idref="c2"/></spine>
</package>`);
	const page = (title, body) => `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>${title}</h1>${body}</body></html>`;
	zip.file('OEBPS/nav.xhtml', page('目录', `<nav epub:type="toc" id="toc"><ol>
<li><a href="chapter1.xhtml">第一章 起源</a></li>
<li><a href="chapter2.xhtml">第二章 旅途</a></li>
</ol></nav>`));
	zip.file('OEBPS/chapter1.xhtml', page('第一章 起源', `<p>这是第一章的内容, 用于测试 EPUB 渲染与目录导航。</p><p>段落二: The quick brown fox jumps over the lazy dog.</p><blockquote>引用样式测试。</blockquote>`));
	zip.file('OEBPS/chapter2.xhtml', page('第二章 旅途', `<p>这是第二章的内容, 含 <strong>粗体</strong>、<em>斜体</em> 与列表:</p><ul><li>条目一</li><li>条目二</li></ul>`));
	zip.file('OEBPS/style.css', 'body{font-family:serif;margin:1em}h1{color:#1a5fb4}blockquote{border-left:3px solid #ccc;padding-left:1em;color:#555}');
	const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', mimeType: 'application/epub+zip' });
	out('epub', 'sample.epub', buf);
	console.log('epub ok');
}

// ---------------------------------------------------------------------------
// XMind (XMind Zen 格式: content.json + metadata.json)
async function genXmind() {
	const zip = new JSZip();
	const content = [{
		id: 'sheet-1', class: 'sheet', title: '测试导图',
		rootTopic: {
			id: 'root', class: 'topic', title: 'Office Viewer',
			children: {
				attached: [
					{ id: 't1', class: 'topic', title: '文档预览', children: { attached: [
						{ id: 't11', class: 'topic', title: 'Excel / Word / PPT' },
						{ id: 't12', class: 'topic', title: 'PDF / EPUB' },
					] } },
					{ id: 't2', class: 'topic', title: '图片查看', children: { attached: [
						{ id: 't21', class: 'topic', title: 'PSD / SVG / ICNS' },
					] } },
					{ id: 't3', class: 'topic', title: '开发工具', children: { attached: [
						{ id: 't31', class: 'topic', title: 'HTTP Client' },
						{ id: 't32', class: 'topic', title: 'Java Decompiler' },
					] } },
				],
			},
		},
	}];
	zip.file('content.json', JSON.stringify(content));
	zip.file('metadata.json', JSON.stringify({ creator: { name: 'Office Viewer', version: '1.0' } }));
	const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
	out('xmind', 'sample.xmind', buf);
	console.log('xmind ok');
}

// ---------------------------------------------------------------------------
// 压缩包家族
async function genArchives() {
	const zip = new JSZip();
	zip.file('readme.txt', text('Office Viewer 压缩包测试文件\n本文件用于测试 zip 解压与目录浏览。\n'));
	zip.file('docs/notes.md', text('# 嵌套目录\n子目录文件测试。'));
	zip.file('src/hello.txt', text('hello world'));
	const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
	out('archive', 'sample.zip', zipBuf);

	// jar: zip + META-INF/MANIFEST.MF
	const jar = new JSZip();
	jar.file('META-INF/MANIFEST.MF', text('Manifest-Version: 1.0\nCreated-By: Office Viewer test\n\n'));
	jar.file('com/example/Hello.class', Buffer.alloc(16, 0xAB));
	jar.file('config.properties', text('name=office-viewer-test\n'));
	out('archive', 'sample.jar', await jar.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));

	// apk: zip 结构占位(查看器按压缩包列出)
	const apk = new JSZip();
	apk.file('AndroidManifest.xml', text('<manifest package="com.example.officeviewer.test"/>'));
	apk.file('classes.dex', Buffer.alloc(64, 0xCD));
	apk.file('res/values/strings.xml', text('<resources><string name="app_name">Test</string></resources>'));
	apk.file('META-INF/MANIFEST.MF', text('Manifest-Version: 1.0\n\n'));
	out('archive', 'sample.apk', await apk.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));

	// vsix: zip + extension.vsixmanifest
	const vsix = new JSZip();
	vsix.file('[Content_Types].xml', text(`<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json"/></Types>`));
	vsix.file('extension.vsixmanifest', text(`<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata><Identity Id="test.sample-1.0.0" Version="1.0.0"/><DisplayName>Sample VSIX</DisplayName></Metadata>
</PackageManifest>`));
	vsix.file('extension/package.json', text(JSON.stringify({ name: 'sample-vsix', version: '1.0.0', displayName: 'Sample VSIX' }, null, 2)));
	out('archive', 'sample.vsix', await vsix.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));

	// crx: CRX2 头 + zip 数据
	const pubkey = Buffer.from('MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA', 'base64');
	const sig = Buffer.alloc(72, 0x42);
	const header = Buffer.alloc(16);
	header.write('Cr24', 0, 'ascii');
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(pubkey.length, 8);
	header.writeUInt32LE(sig.length, 12);
	out('archive', 'sample.crx', Buffer.concat([header, pubkey, sig, zipBuf]));

	// tar / tar.gz / tgz
	const tar = require(path.join(PKG, 'node_modules', 'tar'));
	const staging = path.join(ROOT, '_generate', '_tar_staging');
	const fs = await import('node:fs');
	fs.rmSync(staging, { recursive: true, force: true });
	fs.mkdirSync(path.join(staging, 'docs'), { recursive: true });
	fs.writeFileSync(path.join(staging, 'readme.txt'), 'tar 测试文件\n');
	fs.writeFileSync(path.join(staging, 'docs', 'notes.txt'), 'tar 子目录文件\n');
	out('archive', 'sample.tar', fs.readFileSync(await tarCreate(tar, staging, false)));
	out('archive', 'sample.tar.gz', fs.readFileSync(await tarCreate(tar, staging, true)));
	fs.copyFileSync(path.join(ROOT, 'archive', 'sample.tar.gz'), path.join(ROOT, 'archive', 'sample.tgz'));
	console.log('archive: zip/jar/apk/vsix/crx/tar/tar.gz/tgz ok');

	// 7z: 交由 7z-wasm cli(见 gen7z)
}

function tarCreate(tar, staging, gzip) {
	const file = path.join(ROOT, '_generate', gzip ? '_tmp.tgz' : '_tmp.tar');
	return new Promise((resolve, reject) => {
		tar.c({ file, cwd: staging, gzip: gzip ? { level: 9 } : false }, ['.'])
			.then(() => resolve(file))
			.catch(reject);
	});
}

async function gen7z() {
	const { execFileSync } = await import('node:child_process');
	const cli = path.join(PKG, 'node_modules', '7z-wasm', 'cli.js');
	const staging = path.join(ROOT, '_generate', '_7z_staging');
	const fs = await import('node:fs');
	fs.rmSync(staging, { recursive: true, force: true });
	fs.mkdirSync(staging, { recursive: true });
	fs.writeFileSync(path.join(staging, 'readme.txt'), '7z 测试文件\n');
	fs.writeFileSync(path.join(staging, 'data.bin'), Buffer.alloc(256, 7));
	// 注: 7z-wasm 的虚拟文件系统无法处理 Windows 盘符绝对路径, 输出必须用相对路径
	const rel = path.relative(staging, path.join(ROOT, 'archive', 'sample.7z')).replace(/\\/g, '/');
	execFileSync(process.execPath, [cli, 'a', rel, './readme.txt', './data.bin'], { cwd: staging, stdio: 'pipe' });
	console.log('archive: 7z ok');
}

// ---------------------------------------------------------------------------
// xls(biff8) / ods: SheetJS
function genLegacyExcel() {
	const XLSX = require(path.join(PKG, 'node_modules', 'xlsx'));
	const data = [
		['月份', '销量', '备注'],
		['一月', 1200, 'SheetJS BIFF8'],
		['二月', 1350, ''],
		['三月', 1580, ''],
		['四月', 1490, ''],
		['五月', 1720, ''],
	];
	const ws = XLSX.utils.aoa_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
	const xls = XLSX.write(wb, { bookType: 'biff8', type: 'buffer' });
	out('excel', 'sample.xls', Buffer.from(xls));
	const ods = XLSX.write(wb, { bookType: 'ods', type: 'buffer' });
	out('excel', 'sample.ods', Buffer.from(ods));
	console.log('excel: xls/ods ok');
}

// ---------------------------------------------------------------------------
// 字体: KaTeX 的 ttf/woff/woff2 + 系统 otf
function genFonts() {
	const fontsDir = path.join(PKG, 'node_modules', 'katex', 'dist', 'fonts');
	mkdirSync(path.join(ROOT, 'font'), { recursive: true });
	copyFileSync(path.join(fontsDir, 'KaTeX_AMS-Regular.ttf'), path.join(ROOT, 'font', 'sample.ttf'));
	copyFileSync(path.join(fontsDir, 'KaTeX_AMS-Regular.woff'), path.join(ROOT, 'font', 'sample.woff'));
	copyFileSync(path.join(fontsDir, 'KaTeX_AMS-Regular.woff2'), path.join(ROOT, 'font', 'sample.woff2'));
	// woff2 另取一个字体, 保证三个文件内容不同
	copyFileSync(path.join(fontsDir, 'KaTeX_Main-Regular.woff2'), path.join(ROOT, 'font', 'sample2.woff2'));
	const otfSource = 'C:\\Windows\\Fonts\\DavidCLM-Medium.otf';
	try {
		copyFileSync(otfSource, path.join(ROOT, 'font', 'sample.otf'));
	} catch {
		console.warn('warn: 系统 OTF 字体复制失败, sample.otf 缺失');
	}
	console.log('font ok');
}

await genPdf();
genPsd();
await genParquet();
await genEpub();
await genXmind();
await genArchives();
try {
	await gen7z();
} catch (e) {
	console.warn('warn: 7z-wasm 生成失败(可忽略):', e.message);
}
genLegacyExcel();
genFonts();
console.log('node 部分全部完成');
