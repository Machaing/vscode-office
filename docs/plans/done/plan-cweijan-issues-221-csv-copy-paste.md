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

2026-10-05 静态核查(基于 fork 当前源码):

- issue 时点(v3.0.4)成因:webview 环境中 x-spreadsheet 的复制粘贴依赖隐藏 textarea、系统剪贴板与 focusing 状态,在 VS Code webview 中事件链路存在兼容问题,导致 macOS `cmd+v` 无效;
- 当前状态:x-spreadsheet 已整体 fork 至 `src/react/view/excel/x-spreadsheet/`,粘贴链路完整——
  - `component/sheet.js:1351` 在 window 上绑定 paste 事件(`this.focusing` 时处理,含 `skipNextPaste` 防抖);
  - `core/data_proxy.js` 提供 `pasteFromSystemClipboard`/`pasteFromHtml`/`pasteFromText`,复制走 `clipboardData.setData(text/plain + text/html)`(data_proxy.js:660-662);
  - 右键菜单含 paste/paste-value/paste-format(`component/contextmenu.js`);
  - read 模式(大文件超限截断,见 `3fb480d`)下粘贴禁用属预期行为,普通 csv 以 edit 模式打开不受影响(`Excel.tsx:338`)。

## 修复方案

无需新增修复,上游已修:

- 上游 `c244457`「Fix can't paste on MacOS」(2024-07-15)修复 macOS 粘贴问题,随 fork 带入;
- 本仓库 `c9f3279`「修复mac上excel快捷键异常」(2026-06-08)补充修复 mac 下 excel 编辑器快捷键;
- 另有 `76d71f8`(带 HTML 格式复制)、`b4401fb`(切换 sheet 同步剪贴板高亮)等后续增强。

## 验证方式

- 静态核查结论:已修复(上游 `c244457` + 本仓库 `c9f3279`);
- 建议按复现步骤实测收尾:F5 打开复现 csv,选中单元格 Ctrl+C 后在另一单元格 Ctrl+V(Windows)/cmd+C→cmd+v(macOS),并测试与外部编辑器双向粘贴;macOS 侧建议补测。
