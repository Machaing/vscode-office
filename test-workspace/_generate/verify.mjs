/** 验证 Node 侧生成的文件可被扩展实际使用的解析器读取 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = path.resolve(ROOT, '..');
const ok = [], fail = [];

async function check(name, fn) {
	try {
		await fn();
		ok.push(name);
		console.log(`  PASS ${name}`);
	} catch (e) {
		fail.push([name, e.message]);
		console.log(`  FAIL ${name}: ${e.message}`);
	}
}

// PDF: pdf-lib 重新加载
await check('pdf (pdf-lib)', async () => {
	const { PDFDocument } = require(path.join(PKG, 'node_modules', 'pdf-lib'));
	const doc = await PDFDocument.load(readFileSync(path.join(ROOT, 'pdf', 'sample.pdf')));
	if (doc.getPageCount() !== 2) throw new Error(`期望 2 页, 实际 ${doc.getPageCount()}`);
});

// Parquet: hyparquet 读取(与扩展同一库)
await check('parquet (hyparquet)', async () => {
	const { parquetRead } = require(path.join(PKG, 'node_modules', 'hyparquet'));
	const data = readFileSync(path.join(ROOT, 'parquet', 'sample.parquet'));
	const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
	let count = -1;
	await parquetRead({ file: arrayBuffer, onComplete: (rows) => { count = rows.length; } });
	if (count !== 6) throw new Error(`期望 6 行, 实际 ${count}`);
});

// xls / ods: SheetJS 读取
for (const f of ['sample.xls', 'sample.ods']) {
	await check(`${f} (SheetJS)`, () => {
		const XLSX = require(path.join(PKG, 'node_modules', 'xlsx'));
		const wb = XLSX.read(readFileSync(path.join(ROOT, 'excel', f)));
		const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
		if (rows.length !== 5) throw new Error(`期望 5 行数据, 实际 ${rows.length}`);
	});
}

// xmind: zip 结构 + content.json 可解析
await check('xmind (zip + content.json)', async () => {
	const JSZip = require(path.join(PKG, 'node_modules', 'jszip'));
	const zip = await JSZip.loadAsync(readFileSync(path.join(ROOT, 'xmind', 'sample.xmind')));
	const content = JSON.parse(await zip.file('content.json').async('string'));
	if (!Array.isArray(content) || content[0].rootTopic.title !== 'Office Viewer') throw new Error('content.json 结构错误');
});

// 7z: 用 7z-wasm 列表校验(虚拟 FS 不认盘符绝对路径, 用相对路径)
await check('sample.7z (7z-wasm l)', () => {
	const { execFileSync } = require('node:child_process');
	const cwd = path.join(ROOT, '_generate');
	const rel = path.relative(cwd, path.join(ROOT, 'archive', 'sample.7z')).replace(/\\/g, '/');
	const out = execFileSync(process.execPath, [path.join(PKG, 'node_modules', '7z-wasm', 'cli.js'), 'l', rel], { encoding: 'utf-8', cwd });
	if (!out.includes('readme.txt') || !out.includes('data.bin')) throw new Error('列表缺少条目');
});

// 字体: opentype.js 解析 ttf/otf(woff/woff2 该库不直接支持)
for (const f of ['sample.ttf', 'sample.otf']) {
	await check(`font/${f} (opentype.js)`, () => {
		const opentype = require(path.join(PKG, 'node_modules', 'opentype.js'));
		const font = opentype.parse(readFileSync(path.join(ROOT, 'font', f)).buffer);
		if (!font.unitsPerEm) throw new Error('unitsPerEm 缺失');
	});
}

console.log(`\n通过 ${ok.length}, 失败 ${fail.length}`);
if (fail.length) process.exit(1);
