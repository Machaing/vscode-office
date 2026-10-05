# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/204

## 标题

[BUG] wrong redo shortcut on WYSIWYG markdown view

## 标签

bug

## 问题描述

- 环境: macOS 13.2.1 (22D68);扩展版本 v2.9.5(2023-02-28 提交)
- 用户在 VS Code 中将 redo(重做)快捷键配置为 `ctrl+shift+z`,该键位在 VS Code 其他位置工作正常;
- 但在 WYSIWYG markdown 视图(本扩展的 markdown 编辑器)中,redo 仅对 `ctrl+y` 生效,`ctrl+shift+z` 无响应;
- 用户希望扩展能读取 VS Code 的键位设置,让自己可以继续使用 `ctrl+shift+z`;
- 正文附有一张截图佐证;issue 无评论、无维护者结论。

## 期望行为

WYSIWYG markdown 视图中的 redo 遵循 VS Code 键位配置:用户自定义的 `ctrl+shift+z` 应能触发重做。(推断)至少应同时支持常见平台的 redo 键位(macOS 默认 `cmd+shift+z`、Windows/Linux 的 `ctrl+y` 与 `ctrl+shift+z`),而不是只响应单一硬编码键位。

## 实际行为

WYSIWYG markdown 视图中按 `ctrl+shift+z` 无任何响应,仅 `ctrl+y` 可触发 redo(正文附截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-204-redo-shortcut-wysiwyg.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 markdown 文档(标题、段落、列表、代码块),仅提供可编辑的操作对象,用于在 WYSIWYG 视图中执行「输入 → 撤销 → 重做」序列。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(以 Markdown Viewer/WYSIWYG 方式);
2. 光标置于正文段落中,先输入几个字符再删除,产生可撤销的编辑记录;
3. 按 `ctrl+z`(macOS `cmd+z`)撤销刚才的编辑;
4. 按 `ctrl+shift+z` 尝试重做(报告者的自定义键位;macOS 默认 redo 键位 `cmd+shift+z` 一并验证);
5. 预期: 撤销的内容被重做(遵循 VS Code redo 键位);实际: 无响应;
6. 再按 `ctrl+y`:重做生效,证明 redo 功能本身可用、仅键位映射缺失。

## 根因定位

2026-10-05 静态核查(基于 fork 当前源码),**未修复**:

- redo 键位处理在 `vditor/src/ts/util/editorCommonEvent.ts` 的 keydown 链:undo 匹配 `⌘Z`(L257),redo 仅匹配 `⌘Y`(L264)——`matchHotKey("⌘Y")` 在 Windows/Linux 映射 `Ctrl+Y`、macOS 映射 `Cmd+Y`;
- 全代码库(vditor fork + 扩展侧)无 `⇧⌘Z`/`Ctrl+Shift+Z` 分支(grep 证实);toolbar 通用 hotkey 匹配(editorCommonEvent.ts:338)也未注册该组合;
- 本 fork 新增的 VS Code 键位层 `vditor/src/ts/util/vscodeShortcut.ts`(块复制/选择/删除等)同样无 redo 分支;
- 扩展宿主 `package.json` 仅 4 个 keybindings(markdown paste / html preview / markdown switch / http request),无 redo 转发;
- 故 `Ctrl+Shift+Z`/`⇧⌘Z` 按下时无任何处理,issue 现象至今存在。

## 修复方案

待实施(最小改法):

- `editorCommonEvent.ts:264` 的 redo 分支扩展为同时接受 `⇧⌘Z`/`Ctrl+Shift+Z`:在 `matchHotKey("⌘Y", event)` 之外增加 `isCtrl(event) && event.shiftKey && !event.altKey && (event.key === "z" || event.key === "Z")`;
- 需确认 L257 undo 分支 `matchHotKey("⌘Z")` 对 shift 组合的匹配行为:若 matchHotKey 忽略 shiftKey,则 `Shift+Z` 会先被 undo 分支消费,还需在 undo 分支排除 shiftKey。

进阶(完整遵循 VS Code 键位,可后续再做): webview 无法直接读 VS Code keybindings,无公开 API;可行做法是提供扩展设置项让用户自定义 redo 键位,成本较高,建议先落最小改法。

## 验证方式

- F5 打开复现文件,输入并删除若干字符产生编辑记录 → `Ctrl+Z` 撤销 → `Ctrl+Shift+Z`(macOS `⇧⌘Z`)应重做成功;`Ctrl+Y` 仍可用;`Ctrl+Shift+Z` 不应误触发 undo;
- 现状核查结论:未修复(2026-10-05)。
