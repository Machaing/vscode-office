# 更改日志(简体中文)

> [English version](changelog.md) | 历史版本(4.1.7 及更早)已归档至 [docs/archive/changelog-archive-CN.md](docs/archive/changelog-archive-CN.md)

> 反馈问题请提交 issue 至 [Machaing/vscode-office](https://github.com/Machaing/vscode-office/issues);本扩展为独立维护的 fork,请勿反馈到上游 [cweijan/vscode-office](https://github.com/cweijan/vscode-office)。

# 4.2.2 2026-10-6

Markdown Editor:

- 支持自定义编辑器快捷键;redo 补充 Ctrl+Shift+Z;macOS 不再占用 ⌘H。([cweijan/vscode-office#204](https://github.com/cweijan/vscode-office/issues/204)、[cweijan/vscode-office#218](https://github.com/cweijan/vscode-office/issues/218))
- 工具栏新增快捷键说明面板。
- 支持配置编辑器 UI 界面语言。
- 修复行内 HTML 标签(kbd/mark/span/u/br/img)保存丢失。([cweijan/vscode-office#226](https://github.com/cweijan/vscode-office/issues/226))

# 4.2.1 2026-9-15

Word:

- 修复表格行被跨页切开,整行移至下一页。([cweijan/vscode-office#497](https://github.com/cweijan/vscode-office/issues/497))
- 修复 TIFF 图片空白,渲染前先解码为 PNG。([cweijan/vscode-office#311](https://github.com/cweijan/vscode-office/issues/311))
- 修复 TOC 目录条目文字丢失。([cweijan/vscode-office#597](https://github.com/cweijan/vscode-office/issues/597))

Markdown Editor:

- 新增 `office.markdown.find` 命令,搜索可跳转到匹配处。([cweijan/vscode-office#599](https://github.com/cweijan/vscode-office/issues/599))
- 修复打开即显示已修改、保存时静默改写内容。([cweijan/vscode-office#596](https://github.com/cweijan/vscode-office/issues/596))
- 修复切换窗口后文末空行被删除。([cweijan/vscode-office#601](https://github.com/cweijan/vscode-office/issues/601))
- 修复标题转换后有序列表编号丢失。([cweijan/vscode-office#590](https://github.com/cweijan/vscode-office/issues/590))
- 修复行高与字号不匹配导致代码块行距拥挤。([cweijan/vscode-office#571](https://github.com/cweijan/vscode-office/issues/571))
- 恢复 GFM 表格尺寸规则,移除单元格宽度与换行限制。([cweijan/vscode-office#575](https://github.com/cweijan/vscode-office/issues/575))

Excel:

- 超大 CSV/XLSX 截断为只读预览,防止窗口卡死与内存溢出。([cweijan/vscode-office#239](https://github.com/cweijan/vscode-office/issues/239))
- 修复 `$` 公式不被计算。
- 修复百分比格式小数位,公式显示与保存回写与 Excel 对齐。([cweijan/vscode-office#592](https://github.com/cweijan/vscode-office/issues/592))
- 修复损坏 XLSX 导致 webview 崩溃,回退 SheetJS 并提示错误。([cweijan/vscode-office#576](https://github.com/cweijan/vscode-office/issues/576))

PDF:

- 修复内部链接跳转与外部链接识别。([cweijan/vscode-office#593](https://github.com/cweijan/vscode-office/issues/593))

Export:

- 修复导出失败时静默生成空白 PDF/DOCX/HTML,现会明确报错。([cweijan/vscode-office#603](https://github.com/cweijan/vscode-office/issues/603))

# 4.2.0 2026-8-16

Markdown Editor:

- 支持配置自动焦点恢复。
- 减少切换标签页时多余的焦点恢复。
- 修复 IR 模式下 Shift+Enter 无效。
- 修复 IR 模式下 Markmap 与标题锚点跳转。

PDF:

- 升级 PDF.js 至 v3.1。
- 移除书签侧栏多余的绿色指示。

XMind:

- 修复无法拖动画布。

Git History:

- 优化重置按钮悬停颜色。
- 优化工具栏按钮布局。

# 4.1.9 2026-8-13

Markdown Editor:

- 支持渲染工作区图片。
- 支持粘贴图片到工作区路径。
- 支持 Markmap 图表及交互功能。
- 支持 WikiLink 关系图。
- 修复 IR 模式提示文字重叠。
- 修复退出数学公式编辑器后无法输入。

Excel:

- 支持打开空 XLSX 文件。

XMind:

- 支持编辑 XMind 文件。

SVG:

- 支持自定义预览遮罩。
- 改用 HTML 语法高亮以支持内联 CSS。

Git History:

- 显示 stash 与未提交变更详情。

Editor:

- 脏标记改为星号。

# 4.1.8 2026-7-28

Excel:

- 新增插入图片。
- 新增图片裁剪工具。
- 新增数据透视表读写支持。
- 新增全选单元格。
- 新增高级替换选项。
- 提升 XLSX 加载性能。
- 优化图片选中与拖拽行为。
- 修复图片拖拽锚点定位不准。
- 加载期间隐藏主题切换。

Markdown Editor:

- 修复链接与图片编辑弹窗布局问题。
- 对齐 frontmatter 属性键图标。

PDF:

- 优化侧栏样式。

---

更早版本(4.1.7 及之前)见 [docs/archive/changelog-archive-CN.md](docs/archive/changelog-archive-CN.md) | [English version](changelog.md)
