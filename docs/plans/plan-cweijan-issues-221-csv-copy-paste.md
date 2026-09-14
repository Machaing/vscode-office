# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/221

## 标题

[BUG] Copy paste not working

## 标签

bug

## 问题描述

- 环境: macOS 13.2 (22D49);扩展版本 v3.0.4(2023-04-11 提交)
- 用户打开 csv 文件(由扩展以 x-spreadsheet 的 excel 视图渲染)后,无法使用 `cmd+v` 复制粘贴文本;
- 用户询问这是否为预期行为,并指出 x-spreadsheet 本身支持该功能,因此认为应属于 bug;
- issue 无评论、无维护者结论。

说明: 该 issue 虽为「粘贴」交互类 bug,但涉及的是 csv/excel 查看器(x-spreadsheet),并非 markdown 编辑器;按 SKILL 第 4 步「交互类 bug 按其涉及的查看器归格式」,复现文件归入 excel 格式目录(`.csv`,`officeViewerProvider.ts` 中 `.csv` 后缀路由到 `excel`)。

## 期望行为

在 csv 查看器中可正常复制粘贴:选中单元格/区域后 `cmd+c` 复制,目标单元格 `cmd+v` 粘贴文本。(推断;x-spreadsheet 原生支持该能力)

## 实际行为

csv 文件打开后 `cmd+v` 粘贴无效,无法完成复制粘贴操作。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/excel/test-excel-cweijan-221-csv-copy-paste.csv`
生成脚本: 文本文件,直接维护

文件内容说明: 3 列 × 5 行(含表头)的最小 csv,提供可选中、可复制的单元格数据与可写入的粘贴目标区域。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(以 excel 视图渲染);
2. 选中某个单元格(如 `alice`),按 `cmd+c` 复制(macOS;Windows/Linux 用 `ctrl+c`);
3. 选中另一个单元格,按 `cmd+v` 粘贴;
4. 预期: 复制的文本写入目标单元格(可与 x-spreadsheet 官方示例行为对照);实际: 粘贴无响应;
5. 补充对照: 分别测试「查看器内复制 → 外部编辑器粘贴」与「外部复制 → 查看器内粘贴」两个方向,记录失效方向,便于定位是复制还是粘贴链路的问题。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
