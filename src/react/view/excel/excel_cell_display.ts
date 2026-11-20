import { SSF } from 'xlsx';
import cellEvaluator from './x-spreadsheet/core/cell';
import { formulam } from './x-spreadsheet/core/formula';
import { formatm } from './x-spreadsheet/core/format';
import type { CellData, CellStyle } from './x-spreadsheet/index';

export function displayCellText(
    cell: CellData,
    style: CellStyle,
    getCell: (x: number, y: number) => CellData | null | undefined,
    evalPaused = false,
) {
    let value: any = cell.text || '';
    if (evalPaused) return value;
    // 文件里缓存的公式结果(<v>)优先于重新求值(cweijan-592 round-trip 对齐)
    if (typeof cell.formulaValue === 'string' && typeof cell.text === 'string' && cell.text.startsWith('=')) {
        value = cell.formulaValue;
    } else {
        try {
            value = cellEvaluator.render(value, formulam, (x: number, y: number) => getCell(x, y)?.text || '');
        } catch (e) {
            // 单格求值失败只显示 #VALUE!,不拖垮整个 sheet(cweijan-604)
            console.warn(`formula eval failed at cell "${cell.text}":`, e);
            return '#VALUE!';
        }
    }
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number' && !Number.isFinite(value)) return '#NUM!';
    if (cell.numFmt && cell.numFmtFormat === style.format && value !== '' && Number.isFinite(Number(value))) {
        try { return SSF.format(cell.numFmt, Number(value)); } catch { /* Use viewer format below. */ }
    }
    const formatter = style.format ? formatm[style.format] : undefined;
    return formatter ? formatter.render(value) : value;
}
