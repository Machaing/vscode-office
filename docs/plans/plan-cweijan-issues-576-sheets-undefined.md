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

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
