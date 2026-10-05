# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/226](https://github.com/cweijan/vscode-office/issues/226)

## 标题

[BUG] &lt;kbd&gt;标签会被自动加上``符号变成代码块

## 标签

bug

## 问题描述

2023-04-18 由 MZhao-ouo 报告，环境 OS: Windows11，Extension Version: v3.1.0。

在 markdown 编辑器内打开含 `<kbd>` HTML 标签的文件，无论是否做了修改，按 Ctrl+S 保存时 `<kbd>` 标签都会被自动加上 Markdown 行内代码标记(反引号)，预览中原本渲染为按键样式的 `<kbd>` 退化为代码字面量显示。

- 复现步骤：打开含 `<kbd>` 标签的 Markdown 文件 → 按 Ctrl+S → 检查源码。
- 正文附三张截图，作者说明从上到下依次为"源码、markdown 预览、保存后的源码"，即保存前源码正常、预览中 `<kbd>` 渲染为按键样式，保存后 `<kbd>` 被包上反引号，显示 `<kbd>ctrl</kbd>` 这样的行内代码形式。
- 截至抓取时无任何评论，无维护者结论。

## 期望行为

保存不应改变源码：`<kbd>Ctrl</kbd>` 等内联 HTML 标签原样保留，预览继续渲染为按键样式。

## 实际行为

按 Ctrl+S 后 `<kbd>` 标签被自动加上反引号变成行内代码，预览不再渲染为按键样式，而是显示 `<kbd>ctrl</kbd>` 字面量(见正文三张截图：源码、markdown 预览、保存后的源码)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-226-kbd-tag-backtick.md`
生成脚本: 文本文件,直接维护

文件内容说明: 含多组 `<kbd>` 内联 HTML 标签(按键组合、单个按键、与普通文字/行内代码混排)，均为保存时可能被加反引号改写的场景。

### 复现步骤

1. F5 调起扩展调试，打开复现文件；
2. 不做任何修改，直接 Ctrl+S 保存(另可再试编辑任意内容后保存)；
3. 预期: 源码中 `<kbd>` 标签原样保留，预览渲染为按键样式；实际: `<kbd>` 标签被自动加上反引号变成行内代码，渲染退化为字面量。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
