# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/607](https://github.com/cweijan/vscode-office/issues/607)

## 标题

[BUG] XLSX without <dimension> renders as blank Sheet1 with no error on Windows

## 标签

(无标签,bug 报告)

## 问题描述

Office Viewer 将两个 `.xlsx` 工作簿打开为**空白 `Sheet1` 网格**:工作簿含数据与多个 worksheet,预览却不显示 sheet 名与任何单元格,也无解析错误或警告;同目录较小的基线工作簿打开正常。症状与 #562 相关但场景不同(无内嵌图片,仅 3-4 个 worksheet)。

### 环境与文件

- OS: Windows 11 (10.0.26200)
- VS Code: 1.137.0 (x64)
- 扩展: `cweijan.vscode-office` 4.2.0
- 文件: 本地 `E:` 盘(非 UNC/网络路径)
- 失败文件由某 OOXML 导出器生成,`xl/worksheets/sheet1.xml` 有 49,245 个 cell/value 元素,数据齐全(如 `<x:c r="A2" s="16" t="n"><x:v>45689</x:v></x:c>`)

### 与正常工作簿的结构差异

| 项目 | 正常 `result1.xlsx` | 失败 `result2/result3.xlsx` |
| --- | --- | --- |
| Sheet dimension | `<dimension ref="A1:B145"/>` | **无 `<dimension>` 元素** |
| XML 默认 content type | `application/xml` | workbook 主内容类型用作默认 |
| Workbook content type | 显式 override | 无 `/xl/workbook.xml` 显式 override |
| Worksheet 命名空间 | 默认命名空间 | `x:` 前缀 |

报告者判断缺失 `<dimension>` 最可能使查看器推断出空的 used range;`x:` 前缀本身是合法 XML。

## 期望行为

- `<dimension>` 缺失时从 `sheetData` 实际单元格推断 used range,正常显示数据;或
- 包结构确实不支持时,给出可操作的兼容性错误,而非静默显示空白 `Sheet1`。

## 实际行为

只显示空白 `Sheet1` 网格:无 sheet 名、无数据、无任何错误提示。

# 问题确认及解决

## 复现数据

复现文件(生成脚本: `test-workspace/_generate-script/issue_607_missing_dimension.py`,内容: openpyxl 生成 2 个 sheet `Data1`/`Data2` 后 zipfile 后处理):

1. `test-workspace/excel/test-excel-cweijan-607-missing-dimension.xlsx` — 删除全部 `<dimension/>`(排除项,实测打开正常);
2. `test-workspace/excel/test-excel-cweijan-607-x-prefixed-ns.xlsx` — 删 `<dimension/>` + worksheet XML 元素全部改 `x:` 前缀、根元素 `xmlns=` 改 `xmlns:x=`(根因项,复刻 issue 导出器行为)。

对照文件: 同目录 `sample.xlsx`(openpyxl 常规输出),用于确认"同目录正常文件可打开"的基线。

### 复现步骤

1. F5 调起扩展调试;
2. 先打开 `excel/sample.xlsx` 确认正常(多 sheet + 公式可见);
3. 再分别打开两个复现文件;
4. 预期: 均显示 `Data1`/`Data2` 两个 sheet 及其数据(第 2 个文件走 ExcelJS 抛错 → SheetJS 兜底链路)。

**初次复现结论(2026-10-06)**: 仅删 `<dimension>` 的文件在本仓库打开正常,复现失败——按下方二分结论,该差异本就不触发 bug,且根因场景已被 issue-576 修复覆盖。

## 根因定位(已确认)

### 二分实验

用 Node 直接调 `@cweijan/exceljs` 与 `xlsx`(SheetJS)解析各内存变体,结果:

| 变体 | ExcelJS | SheetJS |
| --- | --- | --- |
| 仅删 `<dimension>` | 正常 | 正常 |
| worksheet XML 加 `x:` 前缀 | **抛 `TypeError: Cannot set properties of undefined (setting 'sheetNo')`** | 正常 |
| `[Content_Types].xml` Default 用 workbook 主类型 + 删 `/xl/workbook.xml` override | 正常 | 正常 |
| 前两者叠加 | 同 `x:` 前缀 | 正常 |

### 结论

- **缺失 `<dimension>` 不是根因**: ExcelJS 转换层用 `worksheet.eachRow` 遍历实际行,SheetJS 缺 dimension 时自动从 `sheetData` 推断 `!ref`,两边都不依赖该元素。issue 报告者的猜测(缺 dimension → 空 used range)不成立。
- **真根因是 worksheet XML 使用 `x:` 命名空间前缀**: ExcelJS 的 xform 按**无前缀标签名**(`worksheet`/`sheetData`/`row`/`c`)注册匹配,sax 解析出 `x:worksheet` 等全部对不上,`WorksheetXform.parseStream` 返回 `undefined`,随后 `worksheet.sheetNo = sheetNo` 赋值抛 TypeError(exceljs `dist/browser/xlsx/xlsx.js` `_processWorksheetEntry`)。OOXML 规范允许任意前缀,属于 ExcelJS 的兼容性缺陷。
- **content type 差异无关**: ExcelJS 按 zip 内文件路径硬编码定位 part(`case 'xl/workbook.xml'`),不读 `[Content_Types].xml`。
- 上游 4.2.0 症状(空白 `Sheet1`、无 sheet 名、无报错)即该 TypeError 未被妥善兜底后落到空数据渲染。

## 修复方案

**无需新修复**: 本仓库 issue-576 已在 `excel_reader.ts` 的 `loadWithExcelJs` 中加入 catch 兜底——ExcelJS 解析抛任何异常时降级 `loadWithSheetJs`(SheetJS 对 `x:` 前缀命名空间解析完全正常,`!ref` 亦不依赖 dimension),恰好覆盖本 issue 场景。这也解释了 F5 实测复现失败。

可选增强(暂不做): 兜底发生时在 UI 提示"该文件使用了非标准结构,已降级兼容模式打开(丢失样式保真)",替代当前仅 `console.warn`。

## 验证方式

- 基线: 上述复现步骤,两个复现文件均正常显示 `Data1`/`Data2`(Node 侧已验证: 根因项文件 ExcelJS 抛错、SheetJS 兜底解析出 `Data1(A1:C21)`/`Data2(A1:B11)`,与 webview 链路一致);
- 回归: `sample.xlsx`、#576 复现文件、#592 复现文件打开均不受影响。
