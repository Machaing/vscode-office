# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/576](https://github.com/cweijan/vscode-office/issues/576)

## 标题

[BUG]Cannot read properties of undefined (reading 'sheets')

## 标签

bug

## 问题描述

提交者 monty086,2026-08-01。环境(OS / Extension Version)均未填写。

正文仅一句:「meet this issues once open xxx.xlsx files」——打开某些 .xlsx 文件即出现该错误,并附一张截图(推测为错误弹窗/报错信息,截图文字无法从 issue 页面提取)。完整报错堆栈未提供,`Cannot read properties of undefined (reading 'sheets')` 仅出现在标题中;无上传文件。

截至抓取时无任何评论,无维护者回复。

## 期望行为

打开异常/非标准 xlsx 时给出友好的错误提示或降级解析(如改用 SheetJS),而不是抛出未捕获的 TypeError 导致查看器不可用(推断,正文未明写)。

## 实际行为

打开部分 xlsx 文件立即报错 `Cannot read properties of undefined (reading 'sheets')`(标题与截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/excel/test-excel-cweijan-576-sheets-undefined.xlsx`
生成脚本: `test-workspace/_generate/issue_576_sheets_undefined.py`

文件内容说明: 先用 openpyxl 生成正常 xlsx,再将包内 `xl/workbook.xml` 改写为空文件后重新打包;其余部件(`[Content_Types].xml`、`_rels/.rels`、`xl/_rels/workbook.xml.rels`、worksheet 等)均保持完好。扩展对 xlsx 走 ExcelJS 加载(`src/react/view/excel/excel_reader.ts` 的 `loadWithExcelJs`),`@cweijan/exceljs` 的 `xlsx/xlsx.js` 解析到 `xl/workbook.xml` 时执行 `model.sheets = workbook.sheets`,而 WorkbookXform 无法从异常/空的 workbook.xml 解析出 model 时 `parseWorkbook` 返回 undefined,读取 `workbook.sheets` 即抛出与标题一致的 TypeError。报告者文件的具体异常点未知,「workbook.xml 为空」是确定触发同类报错的最小构造。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 观察 Excel 查看器加载结果;
3. 预期: 报友好错误或展示空表兜底;实际: 抛出 `Cannot read properties of undefined (reading 'sheets')`,查看器不可用。

## 根因定位

已确认(依赖包内精确定位):

- 抛错点: `@cweijan/exceljs`(5.0.2, fork 自 exceljs)`dist/browser/xlsx/xlsx.js` 第 366 行 —— zip 条目循环 `case 'xl/workbook.xml':` 分支中 `model.sheets = workbook.sheets`。与 issue 标题完全一致的 `TypeError: Cannot read properties of undefined (reading 'sheets')`。
- 返回 undefined 的机制: `parseWorkbook(stream)` 只是 `new WorkbookXform().parseStream(stream)`, 而 `WorkbookXform` 只在 `parseClose('workbook')` 时才构建 `this.model`(`workbook-xform.js`); `xl/workbook.xml` 为空(或无任何标签)时 SAX 解析器不产生任何事件, `parseClose` 永不执行, `BaseXform.parse` 兜底 `return this.model` 即 undefined。该行为继承自 exceljs 上游, 非本 fork 依赖的私有改动。
- 调用链(本项目侧): [excel_reader.ts](../../src/react/view/excel/excel_reader.ts) `loadWithExcelJs` 的 `await workbook.xlsx.load(buffer)` → 依赖内 `XLSX.load` → 上面的 `workbook.sheets` 访问, 同步抛出后随 Promise 拒绝向上传播。同族问题不止这一处: styles.xml 损坏时 reconcile 阶段还会抛 `reading 'styles'`(见验证), 说明 ExcelJS 对部件级损坏普遍缺少防御。
- 本项目侧缺口: Excel.tsx 的加载 try/catch 与错误面板(commit 48b10e4/dbcbc40)已保证「不白屏」, 但 `loadSheets` 无兜底解析, 且面板直接展示原始 TypeError 文案(纯技术信息、无 i18n), 用户无法理解。

## 修复方案

不 patch 依赖, 全部改在本项目代码侧, 共三处:

1. [excel_reader.ts](../../src/react/view/excel/excel_reader.ts) `loadWithExcelJs`: 整体 try/catch, ExcelJS 解析失败时 `console.warn` 后降级调用已有的 `loadWithSheetJs`(SheetJS)兜底; SheetJS 也失败则让错误继续抛出, 交给上层错误面板。可恢复的损坏文件(ExcelJS 严格、SheetJS 宽容, 如 styles.xml 损坏)由此直接恢复展示。
2. [Excel.tsx](../../src/react/view/excel/Excel.tsx): 两处 catch 的 `setLoadError(msg)` 改为 `${$t('viewer.failedParseFile')}: ${msg}`, 错误面板标题由硬编码 `Failed to open file` 改为既有 key `$t('viewer.failedOpenFile')`(该 key 原本已在全部语言文件中定义但无人使用)。
3. i18n: 新增 `viewer.failedParseFile` key 到 [src/react/i18n/messages/](../../src/react/i18n/messages/) 全部 10 种语言(en/zh-cn/zh-tw/ja/de/fr/es/pt-br/ko/ru), 文案如「文件解析失败」/「Failed to parse the file」, 拼接原始原因后与任务要求的「文件无法解析: 原因」形态一致。

不追求让空 workbook.xml 的文件渲染出内容(两个解析器均无法从该文件恢复 sheet 列表), 目标是「不崩溃 + 有可读反馈」。

## 修复记录(已实施)

已于 2026-09-14 实施上述方案, 变更文件:

- `src/react/view/excel/excel_reader.ts`: `loadWithExcelJs` 加 try/catch + SheetJS 兜底(含 issue-576 注释);
- `src/react/view/excel/Excel.tsx`: 引入 `$t`, 两处 catch 组装可读文案, 面板标题走 i18n;
- `src/react/i18n/messages/*.ts`(10 个语言文件): 新增 `viewer.failedParseFile`。

未改动依赖包与 issues.xlsx / ISSUES.md; 不涉及 git 提交(由主会话统一处理)。

## 验证方式

node 侧模拟(esbuild bundle 真实 `excel_reader.ts` 后运行, 与 webview 同一份解析代码), 结果:

| 文件 | 修复前 | 修复后 |
| --- | --- | --- |
| 576 复现文件(空 workbook.xml) | ExcelJS 抛 `TypeError: Cannot read properties of undefined (reading 'sheets')` | 记录 warn 后走 SheetJS 兜底, SheetJS 亦失败(`Could not find file`), 错误被上层 catch, 展示「文件解析失败: Could not find file」(zh-cn)/「Failed to parse the file: Could not find file」(en), 不再出现未捕获异常 |
| sample.xlsx / sample.xlsm / sample.xls / sample.ods / sample.csv | 正常 | 正常(sheet 名与行数一致, 无回归) |
| issue-592 复现文件 | 正常 | 正常 |
| 变体: styles.xml 截断损坏 | ExcelJS reconcile 抛 `reading 'styles')` | SheetJS 兜底成功, 完整恢复两个 sheet 内容(证明兜底分支可成功) |
| 变体: workbook.xml 无 `<sheets>`(合法 XML) | — | 加载为空工作簿, 不崩溃 |

i18n 组合另行以 `initI18n` + `$t` 验证: zh-cn「打开文件失败 / 文件解析失败: …」、en/de/fr 对应文案均正确; 10 个语言文件与 Excel.tsx 均通过 ESLint(仅遗留与本修复无关的既有 exhaustive-deps 警告)与 esbuild bundle 编译。

复验命令(esbuild bundle `.tmp` 入口后 `node` 运行, 或 F5 打开扩展直接预览上述文件):
```bash
npx esbuild <入口>.ts --bundle --platform=node --format=cjs --outfile=<out>.js --log-level=error
node <out>.js
```
