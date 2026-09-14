# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/599](https://github.com/cweijan/vscode-office/issues/599)

## 标题

[BUG] Search in VS code action bar does not jump to text in markdown file

## 标签

bug

## 问题描述

环境:macOS Tahoe 26.6.2,扩展版本 4.2.0(2026-09-05 提交)。

使用 VS Code 侧边栏(action bar)的全局搜索时,点击搜索结果虽然打开了对应的 markdown 文件,但不会跳转到文件内匹配文本的位置,而是停在文件顶部。原话:

> clicking on the results opens the file but does not jump to the text in the file. Instead it opens at the top of the file.

随后切换到 markdown 文本编辑器(铅笔图标,即切换回默认文本编辑器)后,光标同样位于文件顶部,未随搜索结果定位。

正文附一张截图展示搜索结果与文件停在顶部的现象,未提供其他复现细节。

## 期望行为

(推断)点击搜索结果后,文件打开时应定位并滚动到匹配文本所在行,与 VS Code 原生文本编辑器的搜索跳转行为一致。

## 实际行为

文件在扩展的 Markdown 查看器中打开后停在文件顶部,不跳转到匹配位置;再切换到文本编辑器后光标也停留在文件顶部。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-599-search-result-jump.md`
生成脚本: 文本文件,直接维护

文件内容说明: 较长的 Markdown 文档(60 行填充内容),唯一关键词 `SEARCHJUMPTARGET` 位于文件靠后位置(约 80% 处),使「停在文件顶部」与「跳转到匹配行」的差别足够明显。

### 复现步骤

1. F5 调起扩展调试(开发扩展宿主的工作区需包含 `test-workspace`);
2. Ctrl+Shift+F 打开全局搜索,搜索 `SEARCHJUMPTARGET`;
3. 点击搜索结果中复现文件对应的条目,文件以扩展的 Markdown 查看器打开;
4. 预期: 视口/光标跳转到 `SEARCHJUMPTARGET` 所在行;实际: 文件打开在顶部,与 issue 现象一致;
5. 继续验证 issue 的第二段现象:点击编辑器右上角铅笔图标切换到文本编辑器,观察光标是否仍停留在文件顶部。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
