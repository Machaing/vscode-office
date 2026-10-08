/** issue-239 验证: 用 esbuild bundle 真实 excel_reader.ts 后分段计时 CSV 加载链路

用法:
  node test-workspace/_generate/verify_239.mjs <文件> [ext]        # 当前源码
  node test-workspace/_generate/verify_239.mjs <文件> [ext] --orig # git HEAD 版本(修复前基线)

输出 decode / inferSchema / udsv parse / 行对象构建 / loadSheets 全程 / 格式快照 各段耗时,
以及 sheets JSON 的 md5(小文件修复前后必须一致)。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, '..', '..');
const SRC = path.join(PKG, 'src', 'react', 'view', 'excel');

const useOrig = process.argv.includes('--orig');
const readerImport = useOrig ? '../.excel-reader-orig-239.ts' : '../excel_reader.ts';
const origFile = path.join(SRC, '.excel-reader-orig-239.ts');

const harness = /* ts */`
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inferSchema, initParser } from 'udsv';
import { decodeCsvBuffer } from '../csvEncoding.ts';
import { loadSheets } from '${readerImport}';
import { buildFormattingSnapshot } from '../excel_meta.ts';

async function main() {
    const file = process.argv[2];
    const ext = process.argv[3] ?? 'csv';
    const raw = readFileSync(file);
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    const heap = () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const marks = [['start', performance.now(), heap()]];

    if (ext === 'csv') {
        const csvStr = decodeCsvBuffer(ab);
        marks.push(['decodeCsvBuffer', performance.now(), heap()]);
        const parseInput = csvStr.includes('\\n') ? csvStr : csvStr + '\\n';
        const schema = inferSchema(parseInput, { header: () => [] });
        marks.push(['inferSchema', performance.now(), heap()]);
        const rows = initParser(schema).stringArrs(parseInput);
        marks.push(['udsv stringArrs', performance.now(), heap()]);
        const processedRows: any = {};
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const cells: any = {};
            for (let j = 0; j < row.length; j += 1) cells[j] = { text: row[j] == null ? '' : String(row[j]) };
            processedRows[i] = { cells };
        }
        marks.push(['build row objects', performance.now(), heap()]);
        globalThis.__keep = processedRows;
    }

    const data = await loadSheets(ab, ext);
    marks.push(['loadSheets total', performance.now(), heap()]);

    const snapshot = buildFormattingSnapshot(data.sheets);
    marks.push(['buildFormattingSnapshot', performance.now(), heap()]);

    const hash = createHash('md5').update(JSON.stringify(data.sheets)).digest('hex').slice(0, 12);
    let out = '';
    for (let i = 1; i < marks.length; i += 1) {
        const [name, t, h] = marks[i];
        const [, pt] = marks[i - 1];
        out += name + ': +' + (t - pt).toFixed(0) + 'ms (heap ' + h + 'MB)\\n';
    }
    console.log('file=' + file + ' size=' + (raw.length / 1024 / 1024).toFixed(1) + 'MB sheets=' + data.sheets.length
        + ' rows.len=' + data.sheets[0].rows.len + ' cols.len=' + data.sheets[0].cols.len
        + ' maxLength=' + data.maxLength + (data.totalRows != null ? ' totalRows=' + data.totalRows : '')
        + (data.truncated ? ' TRUNCATED' : '') + ' snapshot=' + snapshot.length + 'B md5=' + hash);
    console.log(out.trim());
}

main();
`;

// 入口须放在 excel 源码目录旁, 使 './xxx.ts' 相对导入与 alias 解析生效
const tmpDir = mkdtempSync(path.join(SRC, '.verify239-'));
try {
    if (useOrig) {
        const orig = execFileSync('git', ['show', 'HEAD:src/react/view/excel/excel_reader.ts'], { cwd: PKG });
        writeFileSync(origFile, orig);
    }
    const entry = path.join(tmpDir, 'entry.ts');
    const bundle = path.join(tmpDir, 'bundle.cjs');
    writeFileSync(entry, harness);
    const esbuild = await import('esbuild');
    await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile: bundle,
        logLevel: 'error',
    });
    const args = process.argv.slice(2).filter(a => a !== '--orig');
    execFileSync(process.execPath, [bundle, ...args], { cwd: PKG, stdio: 'inherit' });
} finally {
    rmSync(tmpDir, { recursive: true, force: true });
    rmSync(origFile, { force: true });
}
