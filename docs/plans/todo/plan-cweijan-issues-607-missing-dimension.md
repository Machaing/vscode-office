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

复现文件: `test-workspace/excel/test-excel-cweijan-607-missing-dimension.xlsx`
生成脚本: `test-workspace/_generate/issue_607_missing_dimension.py`

文件内容说明: openpyxl 生成含 2 个 sheet(`Data1`/`Data2`,各含表头 + 数值/文本行,模拟 issue 中"多 worksheet 有数据"结构),再用 zipfile 后处理删除每个 `xl/worksheets/sheetN.xml` 中的 `<dimension ref="..."/>` 元素,复刻"无 dimension"这一关键差异(其余次要变量——`x:` 前缀命名空间、content type override——暂不动,作为后续排除项)。

对照文件: 同目录 `sample.xlsx`(openpyxl 常规输出,含 `<dimension>`),用于确认"同目录正常文件可打开"的基线。

### 复现步骤

1. F5 调起扩展调试;
2. 先打开 `excel/sample.xlsx` 确认正常(多 sheet + 公式可见);
3. 再打开 `test-excel-cweijan-607-missing-dimension.xlsx`;
4. 预期: 显示 `Data1`/`Data2` 两个 sheet 及其数据;
   实际(按 issue): 仅空白 `Sheet1` 网格,无 sheet 名、无数据、无报错。

若删 dimension 后仍正常打开,则说明根因在其余结构差异(`x:` 前缀 / content type),需在生成脚本中追加对应变体继续二分。

## 根因定位

{待分析}(初步线索: 解析链路以 `<dimension>` 为 used range 依据,缺失时可能得到空范围进而渲染空表;需定位 xlsx 解析实现中读取 dimension 的代码路径)

## 修复方案

{待分析}(候选方向: dimension 缺失/无效时遍历 `sheetData` 取实际行列范围兜底;OOXML 规范本身允许省略 dimension)

## 验证方式

{待分析}(基线: 上述复现步骤;回归: `sample.xlsx`、#576 复现文件、#592 复现文件打开均不受影响)
