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

待实施,**依赖 cweijan-204 的动作注册表体系**(见 `todo/plan-cweijan-issues-204-redo-shortcut-wysiwyg.md`),204 落地后本 issue 仅剩默认键位一处增量:

**204 体系顺带解决的部分**(无需单独改动):

- headings 动作进入注册表后,通道 B(`office.markdown.hotkeys`)支持 `"headings": ""` 禁用该键、或改为任意组合;通道 A(`office.markdown.headings` 命令)可在 VS Code「键盘快捷方式」改键——issue 诉求的「增加相关设置,允许用户改键」即满足;
- `Options.ts:134` 的 toolbar 通用 hotkey 匹配机制随注册表收编后不再消费 `⌘H`。

**本 issue 的增量**(204 P2 一行默认值改动):

- 注册表中 headings 动作默认键位按平台区分:**macOS 不绑定默认键**(默认即不抢占系统「隐藏应用」),Windows/Linux 保留 `Ctrl+H` 惯例;
- 注:webview 内 `⌘H` 能否被系统截获因 VS Code/Electron 版本而异,但扩展至少不应主动消费并 preventDefault 该键位——移除 macOS 默认绑定即保证这一点。

若 204 短期不实施,可先行独立最小修复:移除/替换 `Options.ts:134` 的 `hotkey: "⌘H"`(仅 macOS 侧不注册),toolbar 按钮与 tooltip 提示不受影响(tooltip 的 `<⌘H>` 提示同步消失属预期)。

### 实施记录(2026-10-05, 已随 cweijan-204 实施)

- 注册表 headings 动作 `noMacDefault: true`:macOS 下无默认键位,keydown 不再消费 `⌘H`;toolbar 通用匹配段跳过已管理项后,`Options.ts:134` 的 `⌘H` hotkey 也不再触发;
- 通道 A:`office.markdown.headings` 命令(enablement 限 markdown webview 激活),用户可在键盘快捷方式自定义(如改绑 `Ctrl+H` 语义的键);
- 通道 B:`vscode-office.markdown.hotkeys` 的 `"headings"` 键可改键/禁用,热更新生效;
- 残留:工具栏 headings 按钮 tooltip 仍显示 `<⌘H>`(Options hotkey 字段仅剩提示用途,macOS 下有误导,P2 做 tooltip 动态化);macOS 系统级「隐藏应用」恢复需实机验证(Windows 仅能验证 `Ctrl+H` 仍弹 headings 面板)。

## 验证方式

已实施待实测(2026-10-05):

- 需 macOS 环境实测完整现象(Windows 只能验证 `Ctrl+H` 绑定是否仍触发 headings 面板);修复后 macOS 按 `⌘H` 应恢复系统「隐藏应用」行为;
- 通道 B 生效性:`vscode-office.markdown.hotkeys` 配置 `"headings": ""` / 自定义组合后无需 reload 即热更新生效;
- 顺带检查标题层级升降键位(`⌘=`/`⌘-`、`Ctrl+Alt+1~6`)不受影响(已知残留:headings 按钮 tooltip 仍显示 `<⌘H>`)。
