/**
 * plan-fix-20261025-01 Node 侧复测脚本(与 webview 同一份代码, esbuild 打包后运行):
 * 1. test-open-slow.xlsx 经 loadSheets 的分段耗时([excel-perf] 同源数据);
 * 2. 转换产物结构断言(实体 cell 数、列记录条数、滚动范围);
 * 3. 列样式写回验证: applySpreadsheetStyle 作用于 Column 后 `<col>` 是否携带样式定义;
 * 4. 对照既有回归文件(sample.xlsx / 415 / 592 / 604 / 607)确认转换不报错、内容量级正常。
 *
 * 用法: node test-workspace/_tmp/_tmp_excel_open_slow_verify.cjs
 * 依赖的 bundle 产物不入库, 先重新生成:
 *   npx esbuild src/react/view/excel/excel_reader.ts --bundle --format=cjs --platform=node --outfile=test-workspace/_tmp/_tmp_excel_reader_bundle.cjs
 *   npx esbuild test-workspace/_tmp/_tmp_excel_writer_entry.ts --bundle --format=cjs --platform=node --outfile=test-workspace/_tmp/_tmp_excel_writer_bundle.cjs
 */
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const JSZip = require('jszip');
const { loadSheets } = require('./_tmp_excel_reader_bundle.cjs');
const { applySpreadsheetStyle, ExcelJS } = require('./_tmp_excel_writer_bundle.cjs');

const here = __dirname;
const root = join(here, '..', '..');
const readBuffer = (rel) => {
    const buf = readFileSync(join(root, rel));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};

const countCells = (rows) => {
    let n = 0;
    for (const key of Object.keys(rows)) {
        if (key === 'len') continue;
        const row = rows[key];
        if (row && typeof row === 'object' && row.cells) n += Object.keys(row.cells).length;
    }
    return n;
};

const countColEntries = (cols) => {
    let n = 0;
    for (const key of Object.keys(cols)) {
        if (key === 'len') continue;
        const col = cols[key];
        if (col && typeof col === 'object') n += 1;
    }
    return n;
};

(async () => {
    console.log('=== 1. test-open-slow.xlsx 耗时与产物结构 ===');
    {
        const t0 = performance.now();
        const data = await loadSheets(readBuffer('test-workspace/excel/test-open-slow.xlsx'), 'xlsx');
        const total = performance.now() - t0;
        const perf = data.perf;
        console.log(
            `[excel-perf] test-open-slow.xlsx: parse=${Math.round(perf.parseMs)}ms sortState=${Math.round(perf.sortStateMs)}ms`
            + ` convert=${Math.round(perf.convertMs)}ms(${perf.sheetCount} sheets, cells=${perf.cells}, styleAdd=${perf.styleAdds})`
            + ` total=${Math.round(total)}ms`,
        );
        for (const sheet of data.sheets) {
            console.log(
                `  ${sheet.name}: rows.len=${sheet.rows?.len} cells=${countCells(sheet.rows)}`
                + ` cols.len=${sheet.cols?.len} colEntries=${countColEntries(sheet.cols)} styles=${sheet.styles?.length ?? 0}`
                + ` merges=${sheet.merges?.length ?? 0}`,
            );
        }
        if (total > 1000) throw new Error(`耗时未达标: ${Math.round(total)}ms > 1000ms`);
        const oversizeCols = data.sheets.filter((s) => (s.cols?.len ?? 0) > 100);
        if (oversizeCols.length) throw new Error(`滚动范围未收敛: ${oversizeCols.map((s) => `${s.name}:${s.cols.len}`).join(', ')}`);
    }

    console.log('\n=== 2. 列样式写回 <col> 验证 ===');
    {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('t');
        const column = worksheet.getColumn(1);
        column.width = 12;
        applySpreadsheetStyle(column, { bgcolor: '#ff0000', font: { bold: true } });
        worksheet.getCell(1, 2).value = 'x';
        const xmlBuffer = await workbook.xlsx.writeBuffer();
        const zip = await JSZip.loadAsync(xmlBuffer);
        const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
        const colsXml = sheetXml.match(/<cols>[\s\S]*?<\/cols>/)?.[0] ?? '(no cols)';
        console.log(`  ${colsXml}`);
        if (!colsXml.includes('<col ') || !colsXml.includes('style=')) throw new Error('列样式未落为 <col> 定义');
    }

    console.log('\n=== 3. 回归文件转换对照 ===');
    for (const rel of [
        'test-workspace/excel/sample.xlsx',
        'test-workspace/excel/test-excel-cweijan-415-s3-save-error.xlsx',
        'test-workspace/excel/test-excel-cweijan-592-formula-percent-nan.xlsx',
        'test-workspace/excel/test-excel-cweijan-604-nested-if-crash.xlsx',
        'test-workspace/excel/test-excel-cweijan-607-missing-dimension.xlsx',
        'test-workspace/excel/test-excel-cweijan-607-x-prefixed-ns.xlsx',
    ]) {
        const t0 = performance.now();
        const data = await loadSheets(readBuffer(rel), 'xlsx');
        const cells = data.sheets.reduce((sum, s) => sum + countCells(s.rows), 0);
        console.log(
            `  ${rel.split(/[\\/]/).pop()}: ${Math.round(performance.now() - t0)}ms sheets=${data.sheets.length} cells=${cells}`
            + ` cols.len=${Math.max(...data.sheets.map((s) => s.cols?.len ?? 0))}`,
        );
    }

    console.log('\n全部通过');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
