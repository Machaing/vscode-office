# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/603](https://github.com/cweijan/vscode-office/issues/603)

## 标题

[BUG] Only outputting blank PDFs and DOCs now!

## 标签

bug

## 问题描述

- 环境: Windows 11,Extension Version 4.2.0(报告人 rascloud9,2026-09-08 提交);
- 现象: 从 markdown 导出时只写出文件的外层包装,内容全部丢失,三种导出格式同样为空:

| 输出格式 | 文件大小 | 实际内容 |
| --- | --- | --- |
| PDF | 988 字节 | 一张空白 A4 页,无文字、无图片 |
| HTML | 49,969 字节 | 6 个 CSS 主题块,去掉 CSS 后可见内容仅 `</div>` |
| DOCX | 18,609 字节 | document.xml 仅 1,108 字节,无段落、无表格 |

- 即导出管线本身未失败(文件成功写出),但正文内容未进入产物;
- issue 无评论,维护者尚未回复。

## 期望行为

导出的 PDF / HTML / DOCX 包含文档全部内容(标题、表格、公式、文本等)。

## 实际行为

三种格式的导出产物均为只有外壳的空白文件。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-603-blank-pdf-docx-export.md`
生成脚本: 文本文件,直接维护

文件内容说明: 构造一份常规 markdown 文档(多级标题、段落、列表、表格、行内与块级公式),
内容在预览中应可正常渲染,用于验证导出产物是否为空白外壳,与 issue 现象对应。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(预览应正常显示全部内容);
2. 依次执行导出 PDF、导出 DOCX(如有导出 HTML 一并执行),等待产物生成;
3. 打开导出产物检查: 预期: PDF/DOCX 含全部内容;实际: 产物为空白
   (PDF 仅一张空白 A4 页、DOCX 的 document.xml 无段落无表格,见 issue 描述的体积特征)。

## 根因定位

### 导出链路(本仓库)

webview 导出按钮 → `handler.emit("export", option)`(src/provider/markdownEditorProvider.ts)
→ `MarkdownService.exportMarkdown`(src/service/markdownService.ts)
→ `convertMd`(src/service/markdown/markdown-pdf.js):
1. `convertMarkdownToHtml`:宿主侧读磁盘上的 md 文件,markdown-it + 10 个插件渲染出正文 HTML(不经 webview DOM,与 vditor 无关);
2. `mergeHtml`:mustache 渲染 `template/template.html`,把 `{title, style, content}` 注入(`{{{content}}}` 在 `<div class="content-wrapper">` 内);
3. `exportByType`(src/service/markdown/html-export.js):HTML 直接落盘;DOCX 经 vscode-html-to-docx(公式/mermaid 先用 puppeteer 截图替换);PDF 经 puppeteer 打印 + pdf-lib 生成书签。

三者同源:HTML 空则 PDF/DOCX 必空。

### 丢失环节

**正文在步骤 1 丢失,且被"吞异常"掩盖**:`convertMarkdownToHtml` 与 `mergeHtml` 的 catch 只
`showErrorMessage`(console.error)后返回 `undefined`,继续走完导出 → mustache 把 `content=undefined`
渲染为空 → 产物 = 完整 CSS + 空 `<div class="content-wrapper"></div>`(与 issue 报告的
"HTML 仅 CSS + `</div>`"完全吻合),PDF 打印出一张空白 A4,DOCX 无段落,且最后还弹"导出成功"。
任何让渲染链抛异常的因素(依赖加载失败、插件回归、特定内容)都会触发。

### 上游 4.2.0 发布包取证

从 marketplace 下载上游 4.2.0 vsix 分析:其 extension.js 含一套**未提交到 git** 的重构导出管线
(`[markdown-export]` 日志、exportDialog.js、legacy/pro 双样式集,legacy 恰好 4 CSS + katex + margin
= 6 个 `<style>`,与报告者 HTML 的"6 个 CSS 块"吻合)。该管线的 `renderMarkdownToHtml` 同样
catch-all 后返回 `{html:""}`,并且把 mermaid/katex 改为运行时惰性 `require("mermaid")` /
`require("katex")`(out/node_modules/*.js,build.ts 现有源码从未产出过 mermaid.js,发布包含陈旧构建)。
在扩展宿主较旧的 Node/环境上这些运行时 require 一旦失败,`.use()` 抛异常 → catch-all → 全部产物空白。
即:报告者命中的是上游发布包"吞异常 + 环境相关依赖加载失败"的组合;本仓库源码管线一致健康
(Node 22 + 现有 node_modules 下用报告同型文档实测渲染正常),但共享同一"吞异常产出空白"的设计缺陷。

## 修复方案

最小改动收敛在两个文件,原则:**渲染失败宁可中止并报错,绝不落盘空白产物;单特性失败只降级不中止**:

1. `src/service/markdown/markdown-pdf.js`:
   - `convertMarkdownToHtml` catch 后 `throw error`(原先返回 undefined);
   - `mergeHtml` catch 后 `throw error`。异常沿 `convertMarkdown → convertMd → exportMarkdown`
     上抛,由既有 `catch { Output.log(error) }` 弹出 "Office Viewer" 输出通道展示真实错误,且不再写文件、不再弹"导出成功"。
2. `src/service/markdown/ext/markdown-it-katex.js`:`require('katex')` 包进 `loadKatex()` try/catch,
   失败时公式降级为原始 LaTeX 文本继续导出(防上游那类 katex 环境失败把整个导出打成空白)。

不涉及 vditor/选择器/等待时机(本链路不读 webview DOM)。

## 验证方式

node 层直跑真实导出模块(esbuild 按生产配置打包 markdown-pdf.js,out/ 布局,vscode stub):

1. 回归:issue 复现文档导出 HTML 45,167B(非 CSS 正文 5,172 字符、标题/表格/公式齐全);
   富文档(front matter/代码块/公式/mermaid/callout/wikilink)正文 7,073 字符全量保留;
2. PDF:2 页 142,527B(含书签,对照 issue 的 988B 单页空白);DOCX:44,548B,标题/表格俱在,
   公式被 puppeteer+Edge 栅格化为内嵌图片;DOCX 无浏览器时走降级路径同样有完整内容;
3. 故障注入:① 注入损坏的 highlight.js → `convertMd` REJECTED、无任何产物文件(修复前此场景即产出空白三件套);
   ② 注入损坏的 katex → 导出成功,公式降级为原始文本,其余内容不受影响;
4. 手验步骤(扩展内):F5 打开复现文件 → 导出 PDF/DOCX/HTML → 三个产物应含全部内容;
   若某环境再出现渲染失败,应看到输出通道报错且无空白文件生成。

局限:报告者机器上的确切触发异常无法远程取证(上游发布包含未提交代码),已通过 vsix 取证 +
同型故障注入覆盖同类机制;上游 4.2.0 的修复需上游在其当前源码上落地,本仓库已免疫该失败模式。

## 修复记录

- 2026-09-15:定位并修复。`markdown-pdf.js` 渲染/模板异常不再吞掉(上抛中止,杜绝空白产物),
  `markdown-it-katex.js` katex 加载失败降级为原始公式文本。上述验证 1-3 全部通过。
