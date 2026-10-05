# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/323

## 标题

[BUG] Shortcut for switching markdown editor doesn't work

## 标签

bug

## 问题描述

- 环境: Windows;扩展版本 3.3.6(2024-06-25 提交)
- 切换 markdown 编辑器的按钮(编辑器标题栏图标,对应命令 `office.markdown.switch`,title "Switch markdown editor")可以正常工作;
- 但对应的键盘快捷键无效;正文附一张该按钮的界面截图;
- 本仓库现状:该命令默认键位 `ctrl+alt+e`(mac: `ctrl+cmd+e`),keybinding when 条件为 `editorTextFocus && editorLangId == markdown`;按钮菜单项 when 条件为 `resourceExtname == '.md'`(不要求 editorTextFocus);
- issue 无评论、无维护者结论。

## 期望行为

快捷键 `ctrl+alt+e`(mac `ctrl+cmd+e`)与标题栏按钮等效,均能切换 markdown 编辑器。(推断;正文未明写期望,按「按钮可用则快捷键应同样可用」推断)

## 实际行为

点击按钮可正常切换编辑器;按快捷键无任何响应(正文附按钮截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-323-switch-editor-shortcut.md`
生成脚本: 文本文件,直接维护

文件内容说明: 极简 markdown(标题 + 段落 + 列表 + 代码块),作为被切换编辑器打开的操作对象。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(以 Markdown Viewer/WYSIWYG 自定义编辑器方式打开);
2. 点击编辑器标题栏的切换图标("Switch markdown editor",铅笔图标):可正常切换到默认文本编辑器,再切回,确认按钮通路正常;
3. 回到 Markdown Viewer,点击编辑区使焦点位于编辑器内,按 `ctrl+alt+e`(mac: `ctrl+cmd+e`);
4. 预期: 与按钮一样触发编辑器切换;实际: 无响应;
5. 对照: 以默认文本编辑器方式打开同一 md(「打开方式 → 文本编辑器」),焦点在文本编辑器内时按 `ctrl+alt+e`,记录该场景是否生效(注意命令 when 条件含 `editorTextFocus`,自定义编辑器打开时焦点在 webview 而非文本编辑器);
6. 在键盘快捷方式面板搜索 `office.markdown.switch`,确认默认键位未被用户或其他扩展改绑。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
