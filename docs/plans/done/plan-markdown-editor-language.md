# Markdown 编辑器 UI 语言配置

> 来源: 2026-10-05 用户反馈——工具栏 hover 提示显示 "Hotkeys"/"Settings" 等英文,
> 不符合中文用户习惯;希望支持中英文等语言切换,并可在 VS Code 配置中设置默认语言。

## 需求

1. 编辑器 UI(工具栏按钮提示、面板、Hint 等)语言可配置;
2. 默认跟随 VS Code 界面语言,也可显式指定;
3. 修改配置后无需重开文件即可生效。

## 根因

- 编辑器语言本由 `vscode.env.language` 映射 vditor lang(`resource/markdown/lang.js`),
  跟随 VS Code 界面语言,但**无覆盖入口**;
- 个别工具栏项(如上游 settings 项)把提示文案写死为英文 `tip: "Settings"`,
  绕过了 i18n,即使语言为中文也显示英文。

## 实现(2026-10-05)

- **配置项**: `vscode-office.markdown.language`,enum `auto/zh_CN/zh_TW/en_US/ja_JP/ko_KR/ru_RU`,
  默认 `auto`(跟随 VS Code 界面语言);
- **注入**: `markdownEditorProvider.getMarkdownWebviewConfig` 增加 `languageOverride`,
  webview 侧(`resource/markdown/index.js`)计算 `vditorLang`——override 非 auto 优先,
  否则走 `mapVscodeLanguageToVditorLang(vscode.env.language)`;
- **热切换**: `markdown.language` 加入 `MARKDOWN_SYNC_CONFIG_KEYS`,配置变更经
  `markdownConfig` 广播;webview 收到后先 `emit('save')` 落盘未保存内容(越过 400ms 去抖),
  再 `window.location.reload()` 整页重载——重载后 index.js 重新 `emit("init")`,
  宿主重新下发 open,以新语言重建编辑器;
- **写死英文清理**: Options.ts 的 settings 项 `tip: "Settings"` 与 hotkeys 项
  `tip: "Hotkeys"` 移除,改走 `VditorI18n` 词条;i18n 6 语言新增 `settings` 词条
  (设置/設定/Settings/設定/설정/Настройки)。

## 验证方式

- 中文 VS Code 下默认(auto)编辑器提示为中文;配置改为 `en_US` 后打开的 md 编辑器
  自动 reload,工具栏提示/快捷键面板变英文;改回 `zh_CN` 恢复;
- 切换前若有未保存输入,reload 后内容不丢(save 先行);
- settings/hotkeys 按钮 hover 在中文下显示「设置」「快捷键」。

## 关联

- 快捷键面板: `done/plan-markdown-hotkeys-panel.md`
- vditor i18n 词条: `vditor/src/js/i18n/{en_US,ja_JP,ko_KR,ru_RU,zh_CN,zh_TW}.js`
