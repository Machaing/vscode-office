# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/218

## 标题

[BUG] Command + H 与macOS"隐藏应用"的快捷键冲突

## 标签

bug

## 问题描述

- 环境: macOS Ventura(用户原文 "Venture");扩展版本: newest(未填具体版本号,2023-03-31 提交)
- macOS 系统中 `Command+H` 默认是「隐藏应用」快捷键(类似 Windows 的最小化);
- 安装该扩展后,`Command+H` 被 markdown 编辑器绑定占用,功能为调整标题层级(对应 Windows 上的 `Ctrl+H`),覆盖了系统原有行为;
- 用户在扩展设置与 VS Code「键盘快捷方式」界面均未找到可修改该键位的配置项;
- 用户期望增加相关设置,或将该功能改到不与系统快捷键冲突的键位(比如用 Ctrl 代替 Command);
- issue 无评论、无维护者结论。

## 期望行为

`Command+H` 不被扩展抢占:保留 macOS 系统「隐藏应用」行为,或提供设置项允许用户改键/禁用该快捷键(如改用 Ctrl+H 触发标题层级调整)。

## 实际行为

macOS 上按 `Command+H` 触发的是 markdown 编辑器的标题层级调整,系统「隐藏应用」失效;扩展设置与键盘快捷方式界面均无可修改项。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-218-cmd-h-heading-conflict.md`
生成脚本: 文本文件,直接维护

文件内容说明: 含多级标题(#/##/###)与段落的最小 markdown 文档,为「调整标题层级」提供操作对象。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(完整冲突现象需 macOS 环境;Windows 下仅能验证 `Ctrl+H` 绑定本身);
2. 将光标置于任一标题行(如 `## 二级标题`)内;
3. 按下 `Command+H`;
4. 预期: 应用窗口隐藏(macOS 系统默认行为);实际: 标题层级被调整(升降级),窗口不隐藏;
5. 对照: Windows 上按 `Ctrl+H` 可观察到同一「调整标题层级」绑定生效;
6. 检查扩展设置与 VS Code 键盘快捷方式面板(搜索该键位/`office.*`),确认当前不存在可配置项。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
