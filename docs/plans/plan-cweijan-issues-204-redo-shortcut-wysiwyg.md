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

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
