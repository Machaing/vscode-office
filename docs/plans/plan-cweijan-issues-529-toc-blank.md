# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/529](https://github.com/cweijan/vscode-office/issues/529)

## 标题

[BUG] word中的目录无法显示

## 标签

bug

## 问题描述

提交者 MosaicAccount,2026-07-06。

环境:

- OS: macOS 14.8.3
- Extension Version: 4.1.3

正文原文:「打开word文件,目录的序号可以显示出来,但是目录的内容显示为空白。」附一张截图,显示 Word 文件目录条目仅有序号(页码)、内容空白的现象。

正文未单独列出复现步骤等小节,可归纳为:用扩展打开含目录的 Word 文件,目录条目文本不渲染。截至抓取时无任何评论,无维护者回复。

## 期望行为

目录条目「章节标题 + 引导点 + 页码」完整显示,与 Word/WPS 中一致(推断,正文未明写)。

## 实际行为

目录序号(页码)可以显示出来,目录条目的内容显示为空白(正文与截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/word/test-word-cweijan-529-toc-blank.docx`
生成脚本: `test-workspace/_generate/issue_529_toc_blank.py`

文件内容说明: 含 TOC 目录域的 docx,目录条目为域结果区内的普通文本 run + 嵌套 PAGEREF 域(无 `<w:hyperlink>` 包裹,TOC 域跨条目段落),正文含两级标题、分页与书签锚点。该结构与 [#597](plan-cweijan-issues-597-word-toc.md) 复现的 plain 变体同类——缺陷版本下条目文本在解析时丢失、仅剩页码,与「序号可见、内容空白」现象一致;本 fork 已针对 597 实施本地补丁,本文件同时可用作该补丁的回归用例。

注意:报告者原始文件结构未知(未上传),若上述结构在当前版本已修复而问题仍存在,需向上游索取原始文件进一步定位。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 查看文档开头的目录(TOC)区域,并与 Word/WPS 打开同一文件的效果对比;
3. 预期: 目录条目「章节标题 + 引导点 + 页码」完整显示;实际(缺陷版本): 仅显示页码/序号,条目文本空白。

## 根因定位

与 [#597](plan-cweijan-issues-597-word-toc.md) 相同的根因:`@eigenpal/docx-editor-core@1.9.0` 段落内域解析状态机 `q()`(dist/chunk-TNQDZQ6K.mjs)无嵌套域概念,TOC 域 fieldResult 区内出现 PAGEREF 域 `begin` 时,外层已累积的条目文本 run 被整体清空丢弃,条目在 Document 模型层就只剩页码。完整逐 run 分析见 597 plan 的「根因定位(已确认)」,此处不重复。

本 issue 的报告者原始文件未上传,按同类结构推断:复现文件采用「TOC 域结果区普通 run 条目 + 嵌套 PAGEREF(无 hyperlink)、TOC 域跨条目段落」结构,缺陷版本下渲染结果与报告截图「序号(页码)可见、内容空白」一致。

## 修复方案

无需额外修复——已被 597 的本地补丁覆盖:[patches/@eigenpal__docx-editor-core.patch](../../patches/@eigenpal__docx-editor-core.patch)(pnpm patch,`q()` 增加域栈 `fldStack` 支持嵌套域 + 跨段未闭合域摊平,详见 597 plan「修复记录」)。上游发布修复版本后随 597 一并移除补丁升级依赖。

## 修复记录

2026-09-14 验证**已修复**(经 597 补丁顺带覆盖):

- **方式**: 无头 Chrome 跑真实 `DocxEditor` 渲染管线(参照 597 的无头验证)。脚本 `test-workspace/_generate/render529/main.jsx`(esbuild bundle 后静态服务加载,与 `render597/main.jsx` 同一套路,支持 `?file=` 参数),渲染完成后从 `.ProseMirror` 逐段提取文本与首条目 DOM。
- **结果(529 复现文件)**: 六条目录条目全部完整渲染为「标题 + tab + 页码」:
  `第一章 项目概述→1`、`第二章 需求分析→2`、`2.1 功能需求→2`、`2.2 非功能需求→3`、`第三章 系统设计→4`、`第四章 总结与展望→5`;
  首条目 DOM 为文本 run + `<span class="docx-tab">` + `<span class="docx-field docx-field-pageref" data-instruction="PAGEREF _Toc52901 \h">1</span>`,嵌套 PAGEREF 正确保留为域节点。截图: `test-workspace/_generate/render529/render-529-toc.png`。
- **回归(597 两个文件)**: `issue-597-toc-plain.docx` 五条目仍完整(`第一章 引言→1` 等),`issue-597-toc.docx`(hyperlink 版)仍完整且保留条目链接,均无回归。
- 保留推断性说明: 报告者原始文件未上传,若上游有反馈称该结构之外的情形仍复现,需索取原始文件另行定位(见上文根因定位备注)。

## 验证方式

```bash
# 1. 生成复现文件(已有则跳过)
python test-workspace/_generate/issue_529_toc_blank.py

# 2. 构建无头验证 bundle(仓库根目录)
npx esbuild test-workspace/_generate/render529/main.jsx --bundle --format=iife \
  --outfile=test-workspace/_generate/render529/bundle.js --jsx=automatic \
  --platform=browser --define:process.env.NODE_ENV='"production"'

# 3. 以 test-workspace 为根起静态服务
cd test-workspace && python -m http.server 8791 --bind 127.0.0.1

# 4. 浏览器打开(渲染完成后页面 title 变为 RENDER_DONE):
#    http://127.0.0.1:8791/_generate/render529/index.html?file=word/test-word-cweijan-529-toc-blank.docx
#    回归: ?file=word/issue-597-toc.docx 、?file=word/issue-597-toc-plain.docx
#    控制台执行 copy(window.__RESULT__.paragraphs) 取逐段文本;
#    判定: 每条目录条目应同时含标题文本与页码(如 "第一章 项目概述\t1"),而非仅页码。
```
