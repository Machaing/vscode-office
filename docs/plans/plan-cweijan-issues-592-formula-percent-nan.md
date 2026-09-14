# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/592](https://github.com/cweijan/vscode-office/issues/592)

## 标题

[BUG] xlsx 查看器打开含绝对引用的公式(如 =E6/$E$9)显示 NaN%,未使用文件中已有的缓存计算结果

## 标签

bug

## 问题描述

提交于 2026-08-28(正文由提交者用 Claude+GLM5.2 分析总结)。

环境:

- OS: Windows 11
- Extension Version: 4.2.0

复现步骤(正文):

1. 用 Excel/WPS 新建 xlsx:`E6`=23、`E7`=40、`E8`=21;`E9`=`=SUM(E6:E8)`(结果 84);`F6`=`=E6/$E$9`,数字格式 `0.0%`;
2. 保存后文件内同时存有公式与缓存结果:单元格 F6 的 XML 含 `<f>E6/$E$9</f>` 与缓存值 `<v>0.27380952380952384</v>`;
3. 用 Office Viewer 打开该文件。

实际结果:F6 显示 `NaN%`。凡公式含 `$` 绝对引用的单元格——直接形式如 `=E6/$E$9`、`=$E$15*$C$6`,或间接引用这类单元格的如 `=SUM(F6:F8)`——均显示 NaN 或 NaN%。

期望结果:显示 `27.4%`(即文件中已缓存的计算结果);Excel/WPS 打开均正常。

提交者正文附的原因分析(阅读 4.2.0 webview 产物 `out/webview/assets/Excel-*.js` 所得):

1. 加载用 ExcelJS,公式单元格显示 text 被设为公式字符串本身("="+formula),ExcelJS 解析出的缓存 result 未用于显示;
2. 渲染用的小型求值器分词器只接受 `[A-Za-z0-9."()+-*/,:=<>-]`,不含 `$`,`E6/$E$9` 被切成 `["E6", "/", "E", "9", "$", "$"]`,`/` 提前弹出导致除法从空栈取数,`Number(undefined)` 得 NaN;
3. `0.0%` 格式映射为 x-spreadsheet 的 percent 格式,渲染为 `${e}%`,最终显示 `NaN%`。

其他相关问题:percent 渲染不乘 100(`=E6/E9` 显示 `0.27%` 而非 `27.4%`);除法结果超 5 位小数被 `toFixed(2)` 截断。建议:有缓存 result 时优先用它显示;若保留求值器,分词器应支持 `$`(如 `\$?[A-Za-z]+\$?[0-9]+`),percent 格式应乘 100。

无上传文件/截图;截至抓取时无评论。

## 期望行为

显示文件内已缓存的计算结果,如 F6 显示 `27.4%`(见正文期望结果)。

## 实际行为

F6 及所有含 `$` 绝对引用(直接或间接)的公式单元格显示 `NaN%` / `NaN`。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/excel/test-excel-cweijan-592-formula-percent-nan.xlsx`
生成脚本: `test-workspace/_generate/issue_592_formula_percent_nan.py`

文件内容说明: 按正文场景构造——`E6:E8` 为 23/40/21,`E9`=`=SUM(E6:E8)`,`F6:F8`=`=E{r}/$E$9`(格式 `0.0%`),`F9`=`=SUM(F6:F8)`(间接引用),`G15`=`=$E$15*$C$6`(全绝对引用形态)。openpyxl 保存公式不写缓存值,脚本在打包阶段向这些公式单元格注入与公式一致的 `<v>` 缓存结果(如 F6=`0.27380952380952384`),模拟 Excel/WPS 保存的真实文件。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 查看 F 列(占比)与 G15(全绝对引用)单元格的显示值,并与 Excel/WPS 打开效果对比;
3. 预期: F6/F7/F8/F9 依次显示 `27.4%`/`47.6%`/`25.0%`/`100.0%`,G15 显示 `25`;实际: 显示 `NaN%`/`NaN`。

## 根因定位(已确认,以源码核实)

提交者基于 4.2.0 产物的三点分析与本仓库源码一致,真实链路如下:

1. **缓存结果不用于显示**: [excel_reader.ts](../../src/react/view/excel/excel_reader.ts) 的 `formatCellText` 对公式单元格返回 `"=" + cell.formula`(text 即公式字符串),ExcelJS 从 `<v>` 解析出的缓存结果(`cell.result`)原本不参与显示,渲染只能依赖本地求值器。
2. **求值器分词器不支持 `$`**: 渲染兜底求值器 [cell.js](../../src/react/view/excel/x-spreadsheet/core/cell.js) 的 `infixExprToSuffixExpr` 逐字符分词,4.2.0 的字符分类没有 `$` 分支,`$` 落入运算符分支被压入 operatorStack。`E6/$E$9` 实际分词为 `["E6", "/", "E9", "$", "$"]`(提交者按 4.2.0 产物 regex 分词器得到 `["E6","/","E","9","$","$"]`,机理相同):`/` 弹栈时右操作数尚为 undefined,`numberCalc('/', undefined, 23)` → NaN;SUM 间接引用时 numberCalc 对 NaN 操作数走字符串拼接,得到 `"0+NaN+NaN+NaN"`。node 实测(旧版 cell.js):`=E6/$E$9` → NaN、`=SUM(F6:F8)` → `"0+NaN+NaN+NaN"`。
3. **percent 渲染不乘 100**: [excel_styles.ts](../../src/react/view/excel/excel_styles.ts) 把含 `%` 的 numFmt(`0.0%`)映射为 x-spreadsheet 的 `percent` 格式,[format.js](../../src/react/view/excel/x-spreadsheet/core/format.js) 的 percent render 原为 `${v}%`(不乘 100、不按位数舍入),NaN → `NaN%`。

**与本 plan 创建时的状态差异**: 2026-09-06 的提交 `a97a480`(早于本 plan 初始化)已实现下述修复 a/b 与 percent ×100,NaN 问题已消除;但 percent 小数位仍硬编码 `toFixed(2)`,F6 显示 `27.38%` 而非 Excel `0.0%` 语义的 `27.4%`。本次(2026-09-14)核实既有修复的正确性并补齐 c 的小数位语义。

## 修复方案

三层修复(前两层已由 `a97a480` 落地,第三层本次补齐):

1. **有缓存 result 时优先用缓存值显示**(核心,同时解决 NaN 与 percent 显示):
   - `excel_reader.ts` 新增 `formatFormulaValue` 提取 `cell.result`(含 error/richText/Date 处理)写入 `CellData.formulaValue`,`text` 仍保留公式以便保存与编辑;
   - [table.js](../../src/react/view/excel/x-spreadsheet/component/table.js) `renderCell`:公式单元格 `formulaValue` 优先于求值器;
   - [row.js](../../src/react/view/excel/x-spreadsheet/core/row.js):编辑(`setCellText`)、公式重定位(复制粘贴/插入删除行列)时删除 `formulaValue`,使失效缓存不遮蔽重算。
2. **求值器分词器支持 `$`**(无缓存时的兜底正确性): `cell.js` 分词器增加 `$` 分支——绝对引用标记直接剥掉,`$E$9` 与 `E9` 分词一致。
3. **percent 格式对齐 Excel 语义**(本次):
   - [index.ts](../../src/react/view/excel/x-spreadsheet/index.ts) `CellStyle` 增加 `formatDecimals`(数字格式自带的小数位数);
   - `excel_styles.ts` 读取时从 numFmt 提取位数(`0.0%`→1、`0%`→0、`0.00%`→2)写入 `formatDecimals`,保存时 `spreadsheetFormatToNumFmt` 反向映射回原位数 numFmt(此前一律写 `0.00%`,会改写原格式);
   - `format.js` percent render 按 `formatDecimals`(默认 2)`toFixed`,`×100` 后再按位数舍入;
   - `table.js` 将 `style` 传给 `formatter.render(cellText, style)`(其余 format render 均忽略第二参,'number' 的 `useGrouping` 收到真值对象与原默认行为一致)。

**已知限制(不处理)**: 无缓存值时兜底求值器的 `numberCalc` 除法结果超 5 位小数仍 `toFixed(2)` 截断([helper.js](../../src/react/view/excel/x-spreadsheet/core/helper.js)),F6 显示 `27.0%`(Excel 为 27.4%)。真实 Excel/WPS 保存的文件均带 `<v>` 缓存走主路径不受影响;该截断为 x-spreadsheet 上游通用显示行为,不为本 issue 单独放宽。

## 修复记录

- 2026-09-06(提交 `a97a480`,早于本 plan): 缓存值优先显示、求值器 `$` 分词、percent ×100。
- 2026-09-14(本次): 补齐 percent 小数位语义,修改 4 个文件:
  - `src/react/view/excel/x-spreadsheet/index.ts`: `CellStyle.formatDecimals?: number`;
  - `src/react/view/excel/excel_styles.ts`: 新增 `percentDecimalsFromNumFmt`,读取时写入 `formatDecimals`,保存时 `spreadsheetFormatToNumFmt(format, decimals)` 按位数还原 numFmt;
  - `src/react/view/excel/x-spreadsheet/core/format.js`: percent render 接收 `style`,按 `formatDecimals`(默认 2)舍入;
  - `src/react/view/excel/x-spreadsheet/component/table.js`: `formatter.render(cellText, style)`。
  - ESLint 通过;`issues.xlsx` / `ISSUES.md` 未动。

## 验证方式

node 侧 esbuild bundle 真实源码后直接运行(脚本为临时验证,未入库):

1. **求值器单元**(新旧 cell.js 对比): 旧版 `=E6/$E$9` → NaN、`=SUM(F6:F8)` → `"0+NaN+NaN+NaN"`;新版(含 `$` 分词)→ `"0.27"`/`"1.00"`、`=$E$15*$C$6` → `"25.0"`,NaN 消除。
2. **reader 全链路**(`loadSheets` + `renderCell` 同款显示逻辑)跑复现文件:
   - 修复前(4.2.0 等价行为): F6 → `NaN%`;
   - a97a480 后: F6 → `27.38%`(位数不符);
   - 本次修复后: F6/F7/F8/F9 → `27.4%`/`47.6%`/`25.0%`/`100.0%`,E9 → `84`,G15 → `25`,与 Excel `0.0%` 显示一致。
3. **回归**(修复前后 diff,仅 percent 单元格位数变化,其余零差异):
   - `sample.xlsx` / `sample.xlsm`: 输出完全一致(其公式无缓存走求值器、TEXT 公式行为不变);
   - `formula-dollar-ref.xlsx`: percent 单元格位数对齐(`27.38%`→`27.4%` 等),其余一致;
   - 无缓存变体(剥离 `<v>` 的 592 文件): 无 NaN,F6 → `27.0%`(见已知限制),不劣化;
   - `test-excel-cweijan-576-sheets-undefined.xlsx`: 走 issue-576 的解析兜底链,与本修复无关,行为不变。
4. **保存回写**: `applySpreadsheetStyle` round-trip——`percent(1)` → `0.0%`、`percent(0)` → `0%`、`percent(2)`/工具栏默认 → `0.00%`、其他格式映射不变。
