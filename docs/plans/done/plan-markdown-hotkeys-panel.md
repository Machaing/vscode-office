# Markdown 编辑器快捷键说明面板

> 来源: cweijan-204 处理过程的衍生需求(2026-10-05)。用户测试快捷键修复时提出:
> 不知道编辑器有哪些快捷键、各自功能是什么(参考 ld246.com/article/1582778815353 官方汇总),
> 希望编辑器内直接提供快捷键说明。

## 需求

1. 在编辑器内提供全量快捷键说明(键位 + 功能),数据以本仓库代码实际处理为准;
2. 入口放在工具栏,面板可关闭(再次点击按钮或点击面板外部);
3. 多语言(编辑器已支持 6 种语言);
4. 底部注明快捷键自定义方式(cweijan-204 的两个通道)。

## 实现(2026-10-05)

- `vditor/src/ts/util/hotkeyDoc.ts`: 快捷键数据源——按「编辑/格式/标题列表/块操作/表格/模式」分组,
  覆盖代码中全部修饰键快捷键(注册表 14 动作、Ctrl+Alt+1~8、块操作 vscodeShortcut、
  表格上下文 fixBrowserBehavior、FindBar ⌘F/⌘R、Esc、代码块内 ⌘A);
  键位 vditor 格式,渲染时经 `updateHotkeyTip` 平台转换(mac ⌘/其他 Ctrl);
- `vditor/src/ts/toolbar/Hotkeys.ts`: 工具栏下拉面板(vditor-hint + vditor-panel--arrow),
  与 Headings 同款开关语义——再次点击按钮或点击面板外部(document mousedown)关闭;
- 入口: 工具栏 find 按钮旁「键盘」按钮,图标为**内联 SVG**(`codiconKeyboard`,
  不依赖 codicon 字体字形与映射表);hover 提示走 `VditorI18n.hotkeys`;
- i18n: 6 语言新增 20 词条(hotkeys/replace/moveBlockUp/…/hotkeysCustomTip),
  复用 7 个已有词条(alignLeft/insertRowAbove 等);顺带修复上游 Headings 面板
  h1 行 tooltip 的模板笔误(`&lt;` 包进 updateHotkeyTip 参数)。

## 迭代修复(2026-10-05 首测反馈)

- **图标不显示**: 首版 Options.ts 误写 `getToolbarCodicon("keyboard")`(映射表 key 是
  `hotkeys`,`keyboard` 只是 value,查表返回空串)——已改为 `getToolbarCodicon("hotkeys")`,
  且图标路径改为内联 SVG 彻底规避字体/映射问题;
- **面板无法关闭**: 首版用 `vditor.tip.show(html, 0)` 只有内容区一个小 X 可关——
  重写为 toolbar 下拉面板模式(点击外部/再次点击按钮即关闭),`hotkeyDoc.ts` 的
  kbd 增加内联样式,容器改 `max-height:min(70vh,560px)` 滚动;
- **面板右侧截断**(二测反馈): 按钮位于工具栏右侧,面板默认 `left: 0` 向右展开 +
  固定 `width: 600px` 超出视口——参照 Settings 面板(`_toolbar.less` 的
  `vditor-panel--left` 右缘对齐 + `_settingsPanel.less` 的视口约束)改为
  `vditor-panel--left`(向左展开) + `width/maxWidth: min(600px, calc(100vw - 32px))`
  (同时覆盖 `.vditor-hint` 默认 `max-width: 250px`)。

## 验证方式

- F5 打开任意 md: 工具栏 find 旁出现键盘图标按钮;hover 显示本地化文案(中文 VS Code 下为「快捷键」);
- 点击弹出分组表格,键位按平台显示(mac ⌘ / Windows Ctrl);再次点击按钮/点击编辑器/点击其他按钮均关闭;
- 切换编辑器语言(见 plan-markdown-editor-language.md)后面板文案随语言切换。

## 关联

- cweijan-204/218 快捷键自定义: `done/plan-cweijan-issues-204-redo-shortcut-wysiwyg.md`
