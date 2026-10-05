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

2026-10-05 静态核查(基于 fork 当前源码),**未修复**:

- `vditor/src/ts/util/Options.ts:134` headings 工具栏项仍带 `hotkey: "⌘H"`;
- toolbar 所有菜单项的 hotkey 由 `vditor/src/ts/util/editorCommonEvent.ts:338` 的通用匹配在 keydown 时触发:matchHotKey 命中即 dispatch 工具栏动作并 `preventDefault()/stopPropagation()`,macOS 上 webview 内 `⌘H` 事件被该机制消费,系统「隐藏应用」失效;
- 与 issue 时点的差异:当前版本 `⌘H` 触发的是 headings 下拉面板(选择 h1~h6),标题层级升降另有 `⌘=`/`⌘-`(`vditor/src/ts/wysiwyg/processKeydown.ts` L224/L235)与 `Ctrl+Alt+1~6`(`editorCommonEvent.ts:293`);但 `⌘H` 绑定本身仍存在;
- 扩展侧无任何改键/禁用配置项(`package.json` 无相关 setting,vditor hotkey 也未暴露用户配置)。

## 修复方案

待实施:

- 方案 A(最小,推荐): 移除或替换 `Options.ts:134` headings 项的 `hotkey: "⌘H"`(可换为不冲突的组合)。toolbar hotkey 只影响 keydown 触发,移除后工具栏按钮仍可点击;tooltip 中的 `<⌘H>` 提示会同步消失,属预期。若担心 macOS 以外平台依赖 `Ctrl+H`,可按平台区分:仅 macOS 侧不注册。
- 方案 B: 增加扩展设置项(如 `office.markdown.headingHotkey: "default" | "none" | 自定义组合`),经 configs 注入 webview,初始化 vditor 时覆盖 toolbar hotkey。
- 注:webview 内 `⌘H` 能否被系统截获因 VS Code/Electron 版本而异,但扩展至少不应主动消费并 preventDefault 该键位。

## 验证方式

- 需 macOS 环境实测完整现象(Windows 只能验证 `Ctrl+H` 绑定是否仍触发 headings 面板);修复后 macOS 按 `⌘H` 应恢复系统「隐藏应用」行为;
- 顺带检查 tooltip 不再显示 `<⌘H>`、标题层级升降键位(`⌘=`/`⌘-`、`Ctrl+Alt+1~6`)不受影响;
- 现状核查结论:未修复(2026-10-05)。
