import ExcelJS from '@cweijan/exceljs';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { inferSchema, initParser } from 'udsv';
import { decodeCsvBuffer } from './csvEncoding';
import { DEFAULT_ROW_HEIGHT_PX, excelFreezeToExpr, excelRowHeightToPx, readAutofilterRef } from './excel_meta';
import { readWorksheetSortStateXml } from './excel_sort_state';
import { excelJsCellToStyle, StyleRegistry } from './excel_styles';
import { mergeHyperlinkMaps, readCellHyperlink } from './excel_hyperlink';
import { readWorksheetBackgroundImage, readWorksheetImages } from './excel_images';
import { readWorksheetValidations } from './excel_validation';
import {
    isWorksheetProtected,
    readCellEditableFromExcel,
    readWorksheetProtection,
} from './excel_protection';
import type { CellData, SheetData } from './x-spreadsheet/index';

type RowMap = NonNullable<SheetData['rows']>;

type ExcelJsWorksheetWithMerges = ExcelJS.Worksheet & {
    _merges?: Record<string, string | { range?: string }>;
    model: ExcelJS.Worksheet['model'] & {
        mergeCells?: string[];
        merges?: string[];
    };
};

export interface ExcelData {
    sheets: SheetData[];
    maxCols: number;
    maxLength?: number;
    /** Detected column delimiter when loading CSV/TSV */
    csvDelimiter?: string;
    /** 文件实际总行数(所有 sheet 的最大值), 仅在超过上限被截断且可得知总行数时给出; CSV 按行分隔符计数, 为近似值 */
    totalRows?: number;
    /** 行数超过 MAX_LOAD_ROWS, 只加载了前若干行(issue-239) */
    truncated?: boolean;
}

const MIN_COL_WIDTH = 70;
const MAX_COL_WIDTH = 300;
const DEFAULT_COL_WIDTH = 100;
const CHAR_WIDTH = 8;
const MAX_ROWS_TO_CHECK = 10;

/**
 * 单个 sheet 的最大加载行数(issue-239): 100 万行量级的 CSV/XLSX 会把 webview
 * 堆内存撑到 GB 级并冻结整个窗口, 查看器定位是预览, 超限只加载前 MAX_LOAD_ROWS 行。
 * 后续如有需要可提升为用户配置项。
 */
const MAX_LOAD_ROWS = 100_000;

/**
 * issue-239: sheet XML 解压总量超过该体量时放弃 ExcelJS 全量建模(实测 34MB XML 即
 * 耗时约 2.2s、堆 350MB), 改走 SheetJS 的 sheetRows 截断解析(丢失样式保真, 换取可打开)。
 */
const MAX_EXCELJS_XML_SIZE = 64 * 1024 * 1024;

const clampColWidth = (width: number) => Math.min(Math.max(width, MIN_COL_WIDTH), MAX_COL_WIDTH);

const calculateColWidth = (rows: any[], colIndex: number): number => {
    let maxLength = 0;
    for (let i = 0; i < Math.min(rows.length, MAX_ROWS_TO_CHECK); i += 1) {
        const cell = rows[i][colIndex];
        if (cell) {
            const length = String(cell).length;
            if (length > maxLength) {
                maxLength = length;
            }
        }
    }
    return clampColWidth(maxLength * CHAR_WIDTH);
};

const excelColWidthToPx = (width?: number) => {
    if (width == null) return null;
    return Math.round(width * 7 + 5);
};

const normalizeMergeRange = (merge: unknown): string | null => {
    if (typeof merge === 'string') return merge;
    if (merge && typeof merge === 'object' && 'range' in merge) {
        const range = (merge as { range?: unknown }).range;
        return typeof range === 'string' ? range : null;
    }
    return null;
};

const readWorksheetMerges = (worksheet: ExcelJS.Worksheet): string[] => {
    const ws = worksheet as ExcelJsWorksheetWithMerges;
    const mergeCandidates = [
        ...(ws.model?.merges ?? []),
        ...(ws.model?.mergeCells ?? []),
        ...Object.values(ws._merges ?? {}),
    ];
    const merges = mergeCandidates
        .map(normalizeMergeRange)
        .filter((it): it is string => Boolean(it));
    return Array.from(new Set(merges));
};

const expandSizeForMerge = (merge: string, size: { maxRow: number; maxCols: number }) => {
    const range = XLSX.utils.decode_range(merge);
    size.maxRow = Math.max(size.maxRow, range.e.r + 1);
    size.maxCols = Math.max(size.maxCols, range.e.c + 1);
};

const readSheetJsMerges = (worksheet: XLSX.WorkSheet) => (worksheet['!merges'] ?? [])
    .map(merge => XLSX.utils.encode_range(merge));

const expandSizeForSheetJsMerge = (merge: XLSX.Range, size: { maxRow: number; maxCols: number }) => {
    size.maxRow = Math.max(size.maxRow, merge.e.r + 1);
    size.maxCols = Math.max(size.maxCols, merge.e.c + 1);
};

const buildCsvCols = (rows: any[][], colCount: number) => {
    const cols: Record<number, { width: number }> = {};
    for (let i = 0; i < colCount; i += 1) {
        cols[i] = { width: calculateColWidth(rows, i) };
    }
    return cols;
};

const buildColsFromWorksheet = (worksheet: ExcelJS.Worksheet, colCount: number) => {
    const cols: Record<number, { width: number }> = {};
    for (let i = 1; i <= colCount; i += 1) {
        const width = excelColWidthToPx(worksheet.getColumn(i).width) ?? DEFAULT_COL_WIDTH;
        cols[i - 1] = { width: clampColWidth(width) };
    }
    return cols;
};

const formatCellText = (cell: ExcelJS.Cell) => {
    const raw = cell.value;
    if (raw && typeof raw === 'object' && 'hyperlink' in raw) {
        const hv = raw as ExcelJS.CellHyperlinkValue;
        return hv.text || hv.hyperlink || '';
    }
    if (cell.formula) return `=${cell.formula}`;
    const value = cell.value;
    if (value && typeof value === 'object' && 'formula' in value) {
        const formula = (value as { formula?: string }).formula;
        if (formula) return `=${formula}`;
    }
    if (cell.value == null) return '';
    if (cell.text) return cell.text;
    if (cell.value instanceof Date) {
        return cell.value.toISOString().slice(0, 10);
    }
    return String(cell.value);
};

/** 公式单元格是否为公式（含共享公式的从属单元格） */
const isFormulaCell = (cell: ExcelJS.Cell): boolean => {
    if (cell.formula) return true;
    const value = cell.value;
    return Boolean(value && typeof value === 'object'
        && ('formula' in value || 'sharedFormula' in value));
};

/** 提取文件中缓存的公式计算结果（<v>），用于显示；无缓存时返回 null */
const formatFormulaValue = (cell: ExcelJS.Cell): string | null => {
    if (!isFormulaCell(cell)) return null;
    const result: unknown = cell.result;
    if (result == null || result === '') return null;
    if (result instanceof Date) return result.toISOString().slice(0, 10);
    if (typeof result === 'object') {
        const obj = result as Record<string, unknown>;
        if (typeof obj.error === 'string') return obj.error;
        if (Array.isArray(obj.richText)) {
            const joined = obj.richText
                .map(it => (typeof (it as { text?: unknown })?.text === 'string' ? (it as { text: string }).text : ''))
                .join('');
            return joined || null;
        }
        return null;
    }
    return String(result);
};

const readFreezeFromWorksheet = (worksheet: ExcelJS.Worksheet): string | undefined => {
    const views = worksheet.views;
    if (!views?.length) return undefined;
    for (let i = 0; i < views.length; i += 1) {
        const view = views[i];
        if (view.state === 'frozen') {
            const xSplit = view.xSplit ?? 0;
            const ySplit = view.ySplit ?? 0;
            return excelFreezeToExpr(xSplit, ySplit);
        }
    }
    return undefined;
};

type ExcelJsSheetExtras = Pick<SheetData, 'freeze' | 'autofilter'>;

const readSheetExtras = (worksheet: ExcelJS.Worksheet): ExcelJsSheetExtras => {
    const extras: ExcelJsSheetExtras = {};
    const freeze = readFreezeFromWorksheet(worksheet);
    if (freeze) extras.freeze = freeze;
    const autofilter = readAutofilterRef(worksheet.autoFilter);
    if (autofilter) extras.autofilter = autofilter;
    return extras;
};

const applyRowHeight = (rows: RowMap, ri: number, excelRow: ExcelJS.Row) => {
    if (excelRow.height == null) return;
    const px = excelRowHeightToPx(excelRow.height);
    if (Math.abs(px - DEFAULT_ROW_HEIGHT_PX) < 1) return;
    const existing = rows[ri];
    if (existing && typeof existing === 'object' && 'cells' in existing) {
        existing.height = px;
    } else {
        rows[ri] = { cells: {}, height: px };
    }
};

const readWorkbookSortStateXml = async (buffer: ArrayBuffer) => {
    const zip = await JSZip.loadAsync(buffer);
    const entries = new Map<number, ReturnType<typeof readWorksheetSortStateXml>>();
    const worksheetFiles = Object.keys(zip.files)
        .map((name) => {
            const match = /^xl\/worksheets\/sheet(\d+)\.xml$/i.exec(name);
            return match ? { index: Number(match[1]) - 1, name } : null;
        })
        .filter((it): it is { index: number; name: string } => Boolean(it))
        .sort((a, b) => a.index - b.index);

    for (let i = 0; i < worksheetFiles.length; i += 1) {
        const file = worksheetFiles[i];
        const xml = await zip.file(file.name)?.async('string');
        if (!xml) continue;
        entries.set(file.index, readWorksheetSortStateXml(xml));
    }

    return entries;
};

const convertExcelJsWorksheet = (worksheet: ExcelJS.Worksheet, workbook: ExcelJS.Workbook): Pick<SheetData, 'rows' | 'cols' | 'styles' | 'merges' | 'freeze' | 'autofilter' | 'hyperlinks' | 'validations' | 'sheetProtection' | 'images' | 'backgroundImage'> & Pick<ExcelData, 'totalRows' | 'truncated'> => {
    const rows: RowMap = {};
    const styleRegistry = new StyleRegistry();
    const hyperlinkParts: Record<string, { link: string; tooltip?: string }>[] = [];
    const sheetProtected = isWorksheetProtected(worksheet);
    const sheetProtection = readWorksheetProtection(worksheet);
    let maxCols = 0;
    let maxRow = 0;

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (!row || row.cellCount === 0) return;
        // issue-239: 超过上限的行不再逐单元格转换(eachRow 无法中断, 直接跳过)
        if (rowNumber - 1 >= MAX_LOAD_ROWS) return;
        const ri = rowNumber - 1;
        const cells: Record<number, CellData> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (cell.isMerged && cell.address !== cell.master.address) return;

            const ci = colNumber - 1;
            const text = formatCellText(cell);
            const cellStyle = excelJsCellToStyle(cell);
            const editable = readCellEditableFromExcel(cell, sheetProtected);
            const hl = readCellHyperlink(cell, ri, ci);
            if (!text && !cellStyle && editable === undefined && !Object.keys(hl).length) return;

            const formulaValue = formatFormulaValue(cell);
            const styleIndex = styleRegistry.add(cellStyle);
            const cellData: CellData = { text };
            if (formulaValue != null) cellData.formulaValue = formulaValue;
            if (styleIndex != null) cellData.style = styleIndex;
            if (editable !== undefined) cellData.editable = editable;
            cells[ci] = cellData;
            if (ci + 1 > maxCols) maxCols = ci + 1;
            if (ri + 1 > maxRow) maxRow = ri + 1;
            if (Object.keys(hl).length) hyperlinkParts.push(hl);
        });
        if (Object.keys(cells).length > 0) {
            rows[ri] = { cells };
        }
        applyRowHeight(rows, ri, row);
    });

    const rowCount = Math.min(Math.max(maxRow, worksheet.rowCount || 0), MAX_LOAD_ROWS);
    for (let rowNumber = 1; rowNumber <= rowCount; rowNumber += 1) {
        if (rows[rowNumber - 1]) continue;
        const excelRow = worksheet.getRow(rowNumber);
        if (excelRow.height == null) continue;
        applyRowHeight(rows, rowNumber - 1, excelRow);
        if (rowNumber > maxRow) maxRow = rowNumber;
    }

    const merges = readWorksheetMerges(worksheet);
    const sheetSize = { maxRow, maxCols };
    merges.forEach(merge => expandSizeForMerge(merge, sheetSize));
    maxRow = sheetSize.maxRow;
    maxCols = sheetSize.maxCols;

    const colCount = Math.max(maxCols, worksheet.columnCount || 0);
    const cols = buildColsFromWorksheet(worksheet, colCount);
    const styles = styleRegistry.getStyles();
    const sheetExtras = readSheetExtras(worksheet);
    const hyperlinks = mergeHyperlinkMaps(...hyperlinkParts);
    const validations = readWorksheetValidations(worksheet);
    const images = readWorksheetImages(worksheet, workbook);
    const backgroundImage = readWorksheetBackgroundImage(worksheet, workbook);
    const totalRows = worksheet.rowCount || 0;
    const truncated = totalRows > MAX_LOAD_ROWS;

    return {
        rows: { len: maxRow, ...rows },
        cols: { len: colCount, ...cols },
        styles: styles.length > 0 ? styles : undefined,
        merges: merges.length > 0 ? merges : undefined,
        ...(Object.keys(hyperlinks).length ? { hyperlinks } : {}),
        ...(validations.length ? { validations } : {}),
        ...(sheetProtection ? { sheetProtection } : {}),
        ...(images.length ? { images } : {}),
        ...(backgroundImage ? { backgroundImage } : {}),
        ...sheetExtras,
        ...(truncated ? { totalRows, truncated } : {}),
    };
};

const convertExcelJsWorkbook = (
    workbook: ExcelJS.Workbook,
    sortStateXmlMap?: Map<number, ReturnType<typeof readWorksheetSortStateXml>>,
): ExcelData => {
    const sheets: SheetData[] = [];
    let maxLength = 0;
    let maxCols = 26;
    let totalRows: number | undefined;
    let truncated = false;

    workbook.worksheets.forEach((worksheet, index) => {
        const converted = convertExcelJsWorksheet(worksheet, workbook);
        const xmlAutofilter = sortStateXmlMap?.get(index);
        if (xmlAutofilter?.sort && converted.autofilter?.ref) {
            converted.autofilter.sort = xmlAutofilter.sort;
        }
        const rowCount = converted.rows?.len ?? 0;
        if (maxLength < rowCount) maxLength = rowCount;
        if (converted.truncated) {
            truncated = true;
            if (converted.totalRows != null) totalRows = Math.max(totalRows ?? 0, converted.totalRows);
        }

        const colLen = converted.cols?.len ?? 0;
        if (colLen > maxCols) maxCols = colLen;

        sheets.push({
            name: worksheet.name,
            rows: converted.rows,
            cols: converted.cols,
            ...(converted.styles ? { styles: converted.styles } : {}),
            ...(converted.merges ? { merges: converted.merges } : {}),
            ...(converted.freeze ? { freeze: converted.freeze } : {}),
            ...(converted.autofilter ? { autofilter: converted.autofilter } : {}),
            ...(converted.hyperlinks ? { hyperlinks: converted.hyperlinks } : {}),
            ...(converted.validations ? { validations: converted.validations } : {}),
            ...(converted.sheetProtection ? { sheetProtection: converted.sheetProtection } : {}),
            ...(converted.images ? { images: converted.images } : {}),
            ...(converted.backgroundImage ? { backgroundImage: converted.backgroundImage } : {}),
        });
    });

    return {
        sheets,
        maxLength,
        maxCols,
        ...(truncated ? { truncated, ...(totalRows != null ? { totalRows } : {}) } : {}),
    };
};

/** 读取 xlsx 中所有 sheet XML 的解压后体量(只解析 zip 中央目录, 不解压内容) */
const readSheetXmlSize = async (buffer: ArrayBuffer): Promise<number> => {
    const zip = await JSZip.loadAsync(buffer);
    let total = 0;
    for (const name of Object.keys(zip.files)) {
        if (!/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) continue;
        const entry = zip.files[name] as { _data?: { uncompressedSize?: number } };
        total += entry._data?.uncompressedSize ?? 0;
    }
    return total;
};

const loadWithExcelJs = async (buffer: ArrayBuffer): Promise<ExcelData> => {
    try {
        // issue-239: 体量超限时 ExcelJS 全量建模会冻结窗口, 改走 SheetJS 截断解析
        if (await readSheetXmlSize(buffer) > MAX_EXCELJS_XML_SIZE) {
            return loadWithSheetJs(buffer);
        }
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sortStateXmlMap = await readWorkbookSortStateXml(buffer);
        return convertExcelJsWorkbook(workbook, sortStateXmlMap);
    } catch (error) {
        // issue-576: 损坏/非标准 xlsx(如空 workbook.xml)会让 ExcelJS 在解析阶段直接抛
        // TypeError(依赖内部访问 undefined 的 sheets),降级改用 SheetJS 兜底解析
        console.warn('ExcelJS failed to parse workbook, falling back to SheetJS:', error);
        return loadWithSheetJs(buffer);
    }
};

const sheetJsColWidthToPx = (col?: XLSX.ColInfo) => {
    if (!col) return null;
    if (col.wpx != null) return col.wpx;
    if (col.wch != null) return col.wch * CHAR_WIDTH;
    if (col.width != null) return col.width * CHAR_WIDTH;
    return null;
};

const buildColsFromSheetJsWorksheet = (worksheet: XLSX.WorkSheet, colCount: number) => {
    const cols: Record<number, { width: number }> = {};
    const sheetCols = worksheet['!cols'];
    for (let i = 0; i < colCount; i += 1) {
        const width = sheetJsColWidthToPx(sheetCols?.[i]) ?? DEFAULT_COL_WIDTH;
        cols[i] = { width: clampColWidth(width) };
    }
    return cols;
};

const formatSheetJsCell = (cell: XLSX.CellObject) => {
    if (cell.w) return cell.w;
    if (cell.v == null) return '';
    if (cell.v instanceof Date) return cell.v.toISOString().slice(0, 10);
    return String(cell.v);
};

const convertSheetJsWorksheet = (worksheet: XLSX.WorkSheet): Pick<SheetData, 'rows' | 'cols' | 'merges'> & Pick<ExcelData, 'totalRows' | 'truncated'> => {
    const rows: RowMap = {};
    let maxCols = 0;
    let maxRow = 0;
    const ref = worksheet['!ref'];
    if (!ref) {
        return { rows: { len: 0 }, cols: { len: 0 } };
    }

    const range = XLSX.utils.decode_range(ref);
    // issue-239: sheetRows 截断后 !ref 为截断范围, 带 dimension 信息的文件会在 !fullref 保留原始总范围
    const fullRef = worksheet['!fullref'];
    const fullRange = XLSX.utils.decode_range(fullRef ?? ref);
    for (let ri = range.s.r; ri <= Math.min(range.e.r, range.s.r + MAX_LOAD_ROWS - 1); ri += 1) {
        const cells: Record<number, CellData> = {};
        let hasContent = false;
        for (let ci = range.s.c; ci <= range.e.c; ci += 1) {
            const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
            const cell = worksheet[addr];
            if (!cell) continue;
            const text = formatSheetJsCell(cell);
            if (!text) continue;
            cells[ci] = { text };
            hasContent = true;
            if (ci + 1 > maxCols) maxCols = ci + 1;
            if (ri + 1 > maxRow) maxRow = ri + 1;
        }
        if (hasContent) {
            rows[ri] = { cells };
        }
    }

    const sheetSize = { maxRow, maxCols };
    (worksheet['!merges'] ?? []).forEach(merge => expandSizeForSheetJsMerge(merge, sheetSize));
    maxRow = sheetSize.maxRow;
    maxCols = sheetSize.maxCols;

    const colCount = Math.max(maxCols, range.e.c - range.s.c + 1);
    const merges = readSheetJsMerges(worksheet);
    // !fullref 缺失(如生成器未写 dimension)时以「解到上限+1 行」判定截断, 总行数未知
    const truncated = fullRef != null
        ? fullRange.e.r + 1 > MAX_LOAD_ROWS
        : range.e.r + 1 > MAX_LOAD_ROWS;
    const totalRows = fullRef != null ? fullRange.e.r + 1 : undefined;
    return {
        rows: { len: maxRow, ...rows },
        cols: { len: colCount, ...buildColsFromSheetJsWorksheet(worksheet, colCount) },
        merges: merges.length > 0 ? merges : undefined,
        ...(truncated ? { totalRows, truncated } : {}),
    };
};

const convertSheetJsWorkbook = (workbook: XLSX.WorkBook): ExcelData => {
    const sheets: SheetData[] = [];
    let maxLength = 0;
    let maxCols = 26;
    let totalRows: number | undefined;
    let truncated = false;

    for (const sheetName of workbook.SheetNames) {
        const converted = convertSheetJsWorksheet(workbook.Sheets[sheetName]);
        const rowCount = converted.rows?.len ?? 0;
        if (maxLength < rowCount) maxLength = rowCount;
        if (converted.truncated) {
            truncated = true;
            if (converted.totalRows != null) totalRows = Math.max(totalRows ?? 0, converted.totalRows);
        }

        const colLen = converted.cols?.len ?? 0;
        if (colLen > maxCols) maxCols = colLen;

        sheets.push({
            name: sheetName,
            rows: converted.rows,
            cols: converted.cols,
            ...(converted.merges ? { merges: converted.merges } : {}),
        });
    }

    return {
        sheets,
        maxLength,
        maxCols,
        ...(truncated ? { truncated, ...(totalRows != null ? { totalRows } : {}) } : {}),
    };
};

const loadWithSheetJs = (buffer: ArrayBuffer): ExcelData => {
    // issue-239: sheetRows 让解析层只物化前 MAX_LOAD_ROWS 行(多解 1 行用于判定是否截断), 大文件不再全量建模
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, sheetRows: MAX_LOAD_ROWS + 1 });
    return convertSheetJsWorkbook(workbook);
};

/** 近似统计 CSV 总行数(按行分隔符计数, 引号内嵌换行会多计), 仅用于截断提示 */
const countCsvRows = (csvStr: string, rowDelim: string): number => {
    const delimLen = rowDelim.length;
    let count = 0;
    let idx = csvStr.indexOf(rowDelim);
    while (idx !== -1) {
        count += 1;
        idx = csvStr.indexOf(rowDelim, idx + delimLen);
    }
    return count + (csvStr.endsWith(rowDelim) ? 0 : 1);
};

const loadCsv = (buffer: ArrayBuffer): ExcelData => {
    let maxCols = 26;
    const emptySheet = { maxCols, sheets: [{ name: 'Sheet1', rows: { len: 0 } }] };
    const csvStr = decodeCsvBuffer(buffer);
    if (!csvStr) return emptySheet;

    try {
        const leadingEmptyRows = csvStr.match(/^(?:\r\n|\n|\r)+/)?.[0].match(/\r\n|\n|\r/g)?.length ?? 0;
        const csvToParse = leadingEmptyRows > 0 ? csvStr.replace(/^(?:\r\n|\n|\r)+/, '') : csvStr;
        if (!csvToParse) {
            return {
                maxCols,
                maxLength: leadingEmptyRows,
                sheets: [{
                    name: 'Sheet1',
                    rows: { len: leadingEmptyRows },
                }],
            };
        }
        let parseInput = csvToParse;
        if (!parseInput.includes('\n')) parseInput += '\n';
        const schema = inferSchema(parseInput, { header: () => [] });
        // issue-239: 大文件解到上限即停(多解析 1 行用于判断是否截断), 不再把全量行物化进内存
        const rows: string[][] = [];
        initParser(schema).stringArrs<string[]>(parseInput, (row) => {
            rows.push(row);
            return rows.length <= MAX_LOAD_ROWS;
        });
        const truncated = rows.length > MAX_LOAD_ROWS;
        if (truncated) rows.length = MAX_LOAD_ROWS;
        const totalRows = truncated
            ? leadingEmptyRows + countCsvRows(csvToParse, schema.row)
            : leadingEmptyRows + rows.length;
        const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

        const processedRows: RowMap = {};
        for (let i = 0; i < leadingEmptyRows; i += 1) {
            processedRows[i] = { cells: {} };
        }
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const cells: Record<number, CellData> = {};
            for (let j = 0; j < row.length; j += 1) {
                cells[j] = { text: row[j] == null ? '' : String(row[j]) };
                if (j + 1 > maxCols) maxCols = j + 1;
            }
            processedRows[i + leadingEmptyRows] = { cells };
        }
        const csvRows = [
            ...Array.from({ length: leadingEmptyRows }, () => [] as string[]),
            ...rows,
        ];

        return {
            maxCols,
            maxLength: csvRows.length,
            ...(truncated ? { totalRows, truncated } : {}),
            csvDelimiter: schema.col,
            sheets: [{
                name: 'Sheet1',
                rows: { len: csvRows.length, ...processedRows },
                cols: { len: colCount, ...buildCsvCols(csvRows, colCount) },
            }],
        };
    } catch (error) {
        console.error(error);
        return { maxCols, sheets: [{ name: 'Sheet1', rows: { len: 1, 0: { cells: { 0: { text: error.message } } } } }] };
    }
};

const isCsvExt = (ext: string) => /csv|tsv/.test(ext.toLowerCase());
const isOdsExt = (ext: string) => ext.toLowerCase().includes('ods');
const isXlsExt = (ext: string) => ext.toLowerCase().replace(/^\./, '') === 'xls';

export async function loadSheets(buffer: ArrayBuffer, ext: string): Promise<ExcelData> {
    if (isCsvExt(ext)) {
        return loadCsv(buffer);
    }
    if (isXlsExt(ext) || isOdsExt(ext)) {
        return loadWithSheetJs(buffer);
    }
    return loadWithExcelJs(buffer);
}

export function readCSV(buffer: ArrayBuffer): ExcelData {
    return loadCsv(buffer);
}

export async function readExcel(buffer: ArrayBuffer): Promise<ExcelData> {
    return loadWithExcelJs(buffer);
}
