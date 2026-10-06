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

问题出在 markdown 编辑器(vditor)序列化链路的 Lute 渲染/解析两端形态不匹配(lute.min.js 为 Go 编译黑盒,已用 node 直接驱动 `global.Lute` 实测确认):

1. **渲染端**(`Md2VditorDOM`/`Md2VditorIRDOM`):把 `<kbd>`、`<mark>`、`<span style>`、`<u>`、`<br/>`、`<img/>` 等行内 HTML 渲染为 `data-type="html-inline"` 的只读 span,标签源码存于 `data-md-source` 属性,且按「开标签 span + 裸内容 + 闭标签 span」的**分离形态**输出(display 子元素里放未闭合的裸标签,如 `<span class="vditor-html-inline__display"><kbd></span>`)。
2. **序列化端**(`VditorDOM2Md`/`VditorIRDOM2Md`):只能还原「单 span + 完整 `data-md-source`(如 `<kbd>Ctrl</kbd>`)」形态(解析端 `appendHtmlInlineSingleAST` → `mdSourceAttr` 读属性 → `Parse` 还原);对分离形态中只含半截源码(`<kbd>` 或 `</kbd>`)的 span 无法还原,直接丢弃。
3. 后果:打开 → 保存(Ctrl+S 触发 webview `getMarkdown` → `VditorDOM2Md`)往返后,简单标签对(`<kbd>x</kbd>`)只剩裸文本、标签丢失;带属性标签(`<span style="color:red">`)与 void 标签(`<br/>`、`<img/>`)因 display 内标签未闭合、浏览器解析时吞并相邻内容,连内容一起丢。v3.1.0 报告的「加反引号」是当时版本的表现,当前版本已演变为「标签/内容丢失」。
4. 缓解缺口:`styleRestore`(issue-596)仅在「用户未编辑」时整体还原原文;用户编辑过含行内 HTML 的行、或经 undo/切换编辑模式(`switchEditMode` 直接用 `getValue()` 重喂)时,丢失照常发生。

实验还发现两处**不在本 plan 修复范围**的 Lute 上游缺陷:
- 嵌套行内 HTML(`<strong>bold <kbd>K</kbd> end</strong>`)在渲染端(Md2VditorDOM)`data-md-source` 就已错乱(`<kbd> endK</strong>`),序列化无法修复(Go 黑盒),修复前后均错乱,本方案至少保留字面内容。
- 残缺 HTML(`未闭合 <kbd>Ctrl`)兜底字面量化后,Lute 解析会自动补出 `</kbd>`,输出 `<kbd></kbd>`(内容不丢,格式略变,GIGO 边缘可接受)。

## 修复方案

在 vditor 序列化前增加 html-inline 规范化重写,不动 lute.min.js:

- 新增 [vditor/src/ts/markdown/htmlInlineRoundtrip.ts](../../../vditor/src/ts/markdown/htmlInlineRoundtrip.ts) `normalizeHtmlInlineForSerialize(html, vditor)`:把编辑器 DOM 快照(innerHTML)detached 解析后重写——
  - 栈式由内向外将「开标签 span … 闭标签 span」配对合并为单 span,`data-md-source` 拼合为完整标签对(中间文本直取、已合并的内层 span 取其 `data-md-source`、渲染元素借 Lute 转回 md),class 改为 `vditor-ir__node`(不含 `vditor-html-inline` 子串,引导 Lute 走单节点还原分支);
  - void/自闭合/完整对形态只需重写 class(自包含,单节点分支可直接还原);
  - 无法配对的残缺 span 退化为字面文本,保证内容不丢;
  - 仅作用于序列化用的 detached 副本,不影响编辑器内渲染与点击弹窗编辑等交互。
- [vditor/src/ts/markdown/getMarkdown.ts](../../../vditor/src/ts/markdown/getMarkdown.ts) 在 `VditorDOM2Md`/`VditorIRDOM2Md` 之前调用该重写(无 html-inline 的文档零开销直接返回原串)。

## 验证方式

1. node 驱动 `lute.min.js` 确认:分离形态往返丢标签(根因复现)、合并形态(单 span + 完整 data-md-source)双模式完美还原(含 `**bold**` 等 md 格式内嵌)。
2. 浏览器加载构建产物(`resource/markdown/dist`)直接实例化 vditor,`setValue`/`getValue` 全场景对比(wysiwyg + ir 双模式):`<kbd>`、`<mark>`、`<span style>`、`<u>`、`<br/>`、`<img/>`、多行文档、表格/列表内 `<kbd>` 全部通过;代码块内字面 `<kbd>`、块级 html-block 不受影响;表格对齐/`[x]→[X]`/`$$` 格式差异为既有 Lute 规范化(issue-596,保存时 styleRestore 兜底),与本次无关。
3. F5 调试实测:打开 `test-workspace/markdown/test-markdown-cweijan-226-kbd-tag-backtick.md`,不改内容直接 Ctrl+S,源码应原样保留;编辑后保存 `<kbd>` 标签不丢。
