# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/596](https://github.com/cweijan/vscode-office/issues/596)

## 标题

[BUG] Markdown files get silently rewritten (dirty on open; separators / bold / underscores mangled) — the rewrites do NOT come from the Lute engine

## 标签

bug

## 问题描述

2026-09-01 由 MarioHsiao 报告。环境：扩展 office(cweijan.vscode-office) 4.2.0，Markdown viewer(Vditor，WYSIWYG 模式)作为 .md 默认编辑器，macOS 上的 VS Code；Windows 10 机器上未复现(代码密集、英文为主，可能只是触发条件不同)。

症状：打开 Markdown 文件后立即变 dirty(未保存圆点)，保存后源码被重写。六类改动：

1. 水平线：`---` 被替换为 `***`；
2. 转义的粗体标记：`text**《...》**` 变为 `text**《...**`(合法粗体变成转义星号字面量)；
3. 转义下划线：`user_profile` 变为 `user\_profile`；
4. 列表松散化：紧凑列表项之间插入空行；
5. 表格重新对齐：按字符数(而非显示宽度)重算列宽；
6. 粗体重新分段：含行内代码的粗体被拆成多个粗体段，吞掉相邻文本。

纯文本、标题、围栏代码块、行内代码均保留——破坏仅在源码/格式层，但产生大量虚假 diff，对版本控制的文档不可接受。

报告者的关键论证——重写不来自 Lute 引擎：

- 受影响文件已是引擎往返不动点：`Md2VditorDOM -> VditorDOM2Md`(WYSIWYG 模式 + 扩展完整选项)返回字节相同的文件；
- `updateTextDocument()` 在新旧内容相同时短路，引擎链甚至无法将该文件标记为 dirty；
- 引擎所有序列化路径(WYSIWYG 链、IR 链、Lute.FormatStr、裸 DOM、jsdom 往返等)从不产生 `***`、转义星号、`_` 转义或字符数表格对齐；`---` 始终原样输出；
- 扩展内置的 lute.min.js 与本地测试副本 MD5 相同。

推测根因为 AI Polish 功能(报告者源码推断)：`handleAIPolish`(宿主端)将整个文档发给 LLM(VS Code Language Model API，gpt-4o 系或自定义端点)，提示词结尾要求 "Return ONLY the polished Markdown"；webview 中 `streamAIChunk()` 用 LLM 输出替换整个编辑器内容；`onReplaceApplied` 自动触发 input 事件，流入去抖保存链 `R(H) -> E() -> updateTextDocument`，LLM 输出直接写盘——无 diff 审查、无用户确认。观察到的改写特征与 LLM 全文重发完全吻合(`***` 是 LLM 习惯的分隔符风格；对"看似"强调分隔符的星号/下划线防御性转义；列表项间空行；按字符数而非 CJK 显示宽度 2 对齐表格)。

建议排查位置(报告者列出)：

- `resource/markdown/index.js`：Vditor input 回调 → `handler.emit("save", ...)` 路径，审计所有无真实用户操作也能触发内容变更的调用方(AI 替换和粘贴已存在此问题)；
- `out/extension.js`：`on("save")` → `R(H)`(400ms 去抖) → `E()` → `updateTextDocument`(全文 WorkspaceEdit 替换)；
- AI Polish 链：`handleAIPolish`(宿主) + `streamAIChunk` / `onReplaceApplied`(webview)。

报告者的请求：

1. AI Polish 须经显式 diff 审查/Accept 步骤后写回，或仅限当前选区；
2. 禁止 LLM 输出未经确认自动通过 input → save 链持久化；
3. 调查为何纯打开文件(无任何输入)就变 dirty——鉴于 `updateTextDocument` 的相等性短路，必有某条路径在无用户操作时发出内容变更；
4. 可选：提供关闭保存时后台规范化/重排的设置项。

作者补充：多位用户报告过类似的"打开/保存时文件被重写"(分隔符与转义改动)问题，据其所知均未修复。截至抓取时无任何评论，无维护者结论。

## 期望行为

打开文件不应变 dirty；保存(以及未使用 AI Polish 时)不应改写源码——`---`、`**《...》**`、`user_profile`、紧凑列表、表格对齐等原样保留；AI Polish 的结果须经用户显式确认(diff 审查/Accept)后才写回，或仅作用于当前选区。

## 实际行为

打开 Markdown 文件后立即变 dirty；保存后源码出现六类静默改写(`---`→`***`、`**《...》**` 被转义、`user_profile`→`user\_profile`、列表松散化、表格按字符数重排、粗体重新分段)，产生大量虚假 diff。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-596-md-silent-rewrite.md`
生成脚本: 文本文件,直接维护

文件内容说明: 覆盖 issue 列出的六类易被改写结构：`---` 水平分隔线、`text**《...》**` 形式粗体、`user_profile` 等下划线标识符、紧凑列表、需对齐的表格、含行内代码的粗体段；另含纯文本/标题/围栏代码块/行内代码(报告者确认不受影响)作对照。

### 复现步骤

1. F5 调起扩展调试(Vditor WYSIWYG 作为 .md 编辑器)，打开复现文件；
2. 不做任何编辑，观察编辑器标签页的 dirty 状态(未保存圆点)；
3. 预期: 打开后不出现 dirty 圆点；实际: 打开后立即变 dirty。进一步 Ctrl+S 保存后查看源码：预期 `---`/`**《...》**`/`user_profile`/紧凑列表/表格对齐等原样保留；实际出现 `---`→`***`、`user_profile`→`user\_profile` 等静默改写。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
