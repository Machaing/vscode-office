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

待实施。issue 的完整诉求是「扩展遵循/可自定义 VS Code 键位」(报告者原话:希望扩展能读取 VS Code 的键位设置),因此方案主体是**快捷键可自定义体系**,而非仅补一个 shift+z 默认键。

### 总体设计:动作注册表 + 双通道触发

1. **vditor 侧抽「动作注册表」** `vditor/src/ts/util/editorActions.ts`:
   - 集中定义可绑定动作(id / 默认键位 / 标签 / 执行函数 / 适用模式),首批收编现有全部键位——
     undo/redo、bold/italic/strike/link、headings、⌘=/⌘-(标题升降)、Ctrl+Alt+1~6、list/ordered-list/check/quote/line/code/table、indent/outdent、vscodeShortcut 的 copyBlockUp/Down、moveBlockUp/Down、selectBlock、deleteBlock、insertBlockBefore/After;
   - `editorCommonEvent.ts` 的 `hotkeyEvent` 主链(L218 起:handleVscodeShortcut → processKeydown → undo/redo → Ctrl+Alt+1~6 → toolbar 通用 hotkey 匹配)改为查注册表;codeMirror 代码块内部快捷键不动;
   - 提供运行时覆盖接口(`vditor.setHotkeyOverrides(map)` 或 options 传入),供下述两个通道注入用户自定义键位。

2. **通道 A:VS Code 命令 + keybindings 贡献**(满足「在 VS Code 键位体系里改键」的诉求):
   - package.json `contributes.commands` 增加 `office.markdown.undo/redo/bold/...` 动作命令;`contributes.keybindings` 配默认键位,when 子句用 `activeCustomEditorId == 'maizhuoying.markdownViewer'`(custom editor 聚焦时生效;该 context key 可用性需实测,不行则由 `markdownEditorProvider.ts` 在 onDidChangeViewState 时 `setContext('office.markdown.active', …)` 兜底);
   - 宿主把命令转发给活动 webview(handler.emit('execAction', {id})),webview 侧 `handler.on('execAction')` → `editor.executeAction(id)`(vditor 暴露公开方法走注册表执行)——该消息链已有大量先例(gotoBlock / insertImageMarkdown / revealSearchTerm 等);
   - 用户即可在 VS Code「键盘快捷方式」中搜索 `office.markdown.` 改键/禁用/查冲突,获得完整键位管理体验。

3. **通道 B:扩展设置项**(覆盖 VS Code keybinding 触达不到 webview 的场景,web 扩展同样适用):
   - 新增 `office.markdown.hotkeys` 配置(JSON:动作 id → 组合键,空串=禁用该键),宿主读取后经 open 的 config 注入 webview,初始化 vditor 时应用覆盖。

4. **默认键位修正**(顺手关掉 issue 表象,零配置即修复): redo 默认键位改为平台惯例——macOS `⇧⌘Z` 优先、`⌘Y` 兼容;Windows/Linux `Ctrl+Shift+Z`、`Ctrl+Y` 兼容。作为注册表默认值实现,不再硬编码单键。

5. **去重与竞争**:
   - 风险:webview(iframe)聚焦时 VS Code keybinding 与 iframe 内 keydown 可能双触发(或 VS Code 层收不到按键)——通道 A 的 when 子句与实际行为需实测;若双触发,execAction 执行时按时间戳去重或抑制 vditor 内同名动作一次;若 VS Code 层根本收不到,则以通道 B 为主。

### 实施分期

- **P1(最小可用,直接回应 issue)**:动作注册表 + redo/undo 默认键位修正(含 shift+z)+ `office.markdown.undo/redo` 命令与 keybindings 贡献;
- **P2(全量)**:其余动作全部入注册表并贡献 commands/keybindings + `office.markdown.hotkeys` 设置项 + 命令标题 i18n(`src/react/i18n/messages/` 11 种语言);注册表默认值按平台区分——headings 在 macOS 不绑定默认键(顺带关闭 cweijan-218 的 `⌘H` 抢占,详见 `todo/plan-cweijan-issues-218-cmd-h-heading-conflict.md`)。

### 实施记录(2026-10-05, P1 + 通道 B 全量)

- **vditor 动作注册表** `vditor/src/ts/util/editorActions.ts`:14 个动作(undo/redo/headings/bold/italic/strike/link/ordered-list/check/quote/line/code/inline-code/table),toolbar 类动作执行=派发工具栏点击事件(与原 toolbar 匹配段同路径),undo/redo 在无按钮时直接调 `vditor.undo` API 兜底;默认键 vditor hotkey 格式(toolbar 项自动继承 Options 默认),用户覆盖 VS Code 风格(`ctrl+shift+z`,空串=禁用,非法值回退默认);
- **redo 默认键修正**:`["⌘Y", "⇧⌘Z"]`(Windows/Linux 映射 Ctrl+Y / Ctrl+Shift+Z)——零配置直接修复 issue 表象;
- **headings macOS 默认无键**(`noMacDefault`,cweijan-218);
- **主链接入** `editorCommonEvent.ts`:hotkeyEvent 主链在 hint 之后、vscodeShortcut/processKeydown 之前插入注册表匹配(用户覆盖键优先于内置键);删除原 undo/redo 硬编码段;toolbar 通用匹配段(顶层+子菜单)跳过注册表已管理项,防默认键双触发;
- **公开接口**:`IOptions.hotkeys` + `Vditor.executeAction(id)` / `setHotkeyOverrides(map)`;两通道(键盘/宿主命令)300ms 双向去重,防同一次按键被 VS Code keybinding 与 iframe keydown 各触发一次;
- **通道 A**:`package.json` commands `office.markdown.undo/redo/headings`(enablement `activeCustomEditorId == 'maizhuoying.markdownViewer'`)+ keybinding `office.markdown.redo` 默认绑 `ctrl+shift+z`/mac `cmd+shift+z`;`extension.ts`/`extension.web.ts` 注册命令,provider `execActionInActiveEditor` 经 `handler.emit('execAction')` 转发,webview `handler.on('execAction')` → `editor.executeAction(id)`;
- **通道 B**:`vscode-office.markdown.hotkeys` 设置项(动作 id → 组合键),`getMarkdownWebviewConfig` 注入 + `MARKDOWN_SYNC_CONFIG_KEYS` 加入热更新(改设置即广播,无需 reload);webview 初始化经 Vditor `options.hotkeys` 应用;
- **构建验证**:vditor `vite build` 产物含注册表(⇧⌘Z 默认键等特征);主项目 `lint:fix` 0 error + `npm run build` 全链路通过,`out/extension(.web).js` 含新命令;
- **P2 余项(未实施)**:块操作/标题升降(⌘=/⌘-/Alt+方向键/Ctrl+L 等)收编、insert-before/after 等无 toolbar 按钮动作的直接执行逻辑、其余动作的 commands/keybindings 贡献、命令标题 i18n。

## 验证方式

已实施待实测(2026-10-05,Windows 侧 F5 即可验证,macOS 侧补测):

1. **默认键**:打开复现文件,输入并删除若干字符 → `Ctrl+Z` 撤销 → `Ctrl+Shift+Z`(macOS `⇧⌘Z`)应重做(修复前无响应);`Ctrl+Y` 仍可用;shift 组合不会被 undo 误吞(matchHotKey 的 `⌘Z` 匹配不含 shift);
2. **通道 A**:键盘快捷方式搜索 `office.markdown.redo`(已有默认绑定 ctrl+shift+z),改为其他组合后在 webview 内生效——需实测 webview 聚焦时 VS Code keybinding 是否派发(已知风险点,不生效时由通道 B 兜底);确认 when 子句不影响普通编辑器中的同键位;
3. **通道 B**:settings 配置 `"vscode-office.markdown.hotkeys": { "redo": "ctrl+alt+r" }` 或 `"headings": ""` 禁用,修改后无需 reload 即热更新生效;
4. 双通道去重:webview 内按 `Ctrl+Shift+Z`,redo 只执行一次(不因 VS Code 命令 + keydown 双触发而重做两步)。
