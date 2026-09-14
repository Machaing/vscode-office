# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/571](https://github.com/cweijan/vscode-office/issues/571)

## 标题

[BUG]代码块内各行文字挤在一起

## 标签

bug

## 问题描述

2026-07-27 由 crayon05 报告，环境 OS: macOS("macos27")，Extension Version: 4.1.7。

Markdown 渲染/预览时，代码块内各行文字挤在一起(行间距异常)。正文附一张截图(私有用户图片链接)展示代码块行距问题。

- 正文未提供复现步骤、期望/实际行为分节，也未给出代码块 Markdown 示例原文——正文只有环境信息和截图。
- 截至抓取时无任何评论，无维护者结论。

## 期望行为

(推断)代码块内各行之间保持正常行高/行距，与正文及其他 Markdown 渲染器(如 GitHub)一致，行与行不挤压、可读性正常。

## 实际行为

代码块内各行文字挤在一起，行间距异常(见正文截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-571-codeblock-line-spacing.md`
生成脚本: 文本文件,直接维护

文件内容说明: 构造多个不同语言的代码块(无语言标注、js、python、json、text 中英文混排)，每块含多行内容，其中一块内含空行，用于观察各代码块的行高/行距表现。issue 未提供示例原文，按"多代码块、多行内容"语义最小化构造。

### 复现步骤

1. F5 调起扩展调试，打开复现文件；
2. 查看各代码块内各行之间的行间距；
3. 预期: 各行之间行高正常、行与行不挤压；实际: 各行文字挤在一起，行间距异常。

## 根因定位

### 样式链

Markdown 编辑器默认 wysiwyg 模式(`src/provider/markdownEditorProvider.ts:475` `editMode` 默认 `wysiwyg`)。代码块在该模式下由 CodeMirror 渲染:`vditor/src/ts/codeBlock/codeMirrorPreviewRender.ts` 在预览态把 `pre` 挂上 `vditor-cm-preview-host vditor-cm-host` 双类并注入 EditorView,编辑态共用 `.vditor-cm-host`。样式全部来自 `vditor/src/assets/less/_codemirror.less`(构建进 `dist/index.css`),`resource/markdown/index.css` 覆盖层不涉及代码块。

### 根因:行高与字号使用了两条脱钩的变量链

- 字号(`_codemirror.less` `.vditor-cm-host .cm-editor/.cm-scroller/.cm-content/.cm-line`):`font-size: var(--editor-font-size, ...)`,其中 `--editor-font-size` 定义在 `.vditor` 上(`index.less:84`)= `var(--vscode-editor-font-size, 16px)`,且设置面板/本地记忆会直接在 `.vditor` 上内联覆盖它(`vditor/src/ts/toolbar/Settings.ts:220`、`util/globalLocalStorageSettings.ts:352`);
- 行高(`.vditor-cm-host .cm-scroller`):`line-height: calc(var(--vscode-editor-font-size, 13px) * 1.35)`。

上游提交 d1f7c9e「Fix CodeMirror font not syncing with configuration settings」(2026-06-26)把字号改为跟随 `--editor-font-size`,但 `.cm-scroller` 的行高漏改,仍钉在原始 `--vscode-editor-font-size`(且回退值 13px 与字号链的 16px 不一致)。两链脱钩后:

| 场景 | 字号 | 行高(修复前) | 比率 |
| --- | --- | --- | --- |
| 宿主未注入 `--vscode-editor-font-size` | 16px(回退) | 13×1.35 = 17.55px | 1.10,挤压 |
| 用户在设置面板调大编辑字号(如 20px) | 20px | 仍为 vscode 变量×1.35(如 18.9px) | 0.945,行与行重叠 |
| 两链恰好一致 | N | N×1.35 | 1.35,低于 GFM 基准(1.45~1.5) |

任一脱钩场景即出现"代码块内各行文字挤在一起"(issue 截图现象,报告者环境 4.1.7/macOS)。

## 修复方案

在 vditor 源码层修改(`resource/markdown/index.css` 无对应覆盖层):`_codemirror.less` 的 `.cm-scroller` 行高改用与字号完全相同的变量链,倍数取 1.5(GFM 基准 1.45~1.5,并与数学公式块 CM host 既有写法 `_codemirror.less:936` 一致):

```less
line-height: calc(var(--editor-font-size, var(--vscode-editor-font-size, 13px)) * 1.5);
```

任何字号来源(宿主注入/回退/设置面板内联覆盖)下行距恒为字号×1.5,不再脱钩。代码内对行高的其他消费(`blockHandle.ts`、`blockMarker.ts`、`hint/index.ts` 等)均运行时读取 computed line-height,无硬编码假设,改 CSS 安全。

## 修复记录(2026-09-14)

`vditor/src/assets/less/_codemirror.less`(`.vditor-cm-host .cm-scroller`):

```diff
   .cm-scroller {
     overflow: auto;
     max-height: var(--cm-block-max-height, none);
     scrollbar-gutter: stable;
     font-family: inherit;
-    line-height: calc(var(--vscode-editor-font-size, 13px) * 1.35);
+    // 行高必须与 font-size 使用同一变量链(--editor-font-size),
+    // 否则用户在设置面板调大字号后行距不再随之放大,各行文字会挤在一起(issue-571)
+    line-height: calc(var(--editor-font-size, var(--vscode-editor-font-size, 13px)) * 1.5);
     .vditor-cm-scrollbar(var(--cm-bg-color));
   }
```

已手动执行 vditor 构建(`vditor/` 下 `vite build --mode production`)重建本地 `resource/markdown/dist/`(gitignore,package 构建时会自动再生成)。

## 验证方式

无头验证:静态服务 + chrome-devtools MCP 加载 `test-workspace/markdown-style-check/harness.html`(引用真实 `resource/markdown/dist/index.css`,`.sim-legacy` 作用域复刻修复前行高规则作同页对照),度量 `.cm-line` 的 computed font-size / line-height(截图 `verify-table-and-codeblock.png`):

| 场景 | 修复后 字号/行高(比率) | 修复前(复刻对照) |
| --- | --- | --- |
| A 宿主注入 `--vscode-editor-font-size:14px` | 14 / 21(1.5) | 14 / 18.9(1.35) |
| B 宿主未注入(回退链) | 16 / 24(1.5) | 16 / 17.55(**1.10,挤压**) |
| C 设置面板字号 20px(内联 `--editor-font-size`) | 20 / 30(1.5) | 20 / 18.9(**0.945,行盒重叠**) |

局限:纯 CSS 层验证(真实布局计算),未在真实 VS Code webview 内 F5 实测;CodeMirror 运行时注入的样式不设 `.cm-scroller` 行高,与本规则无冲突。手动复验步骤: F5 调试扩展 → 打开 `test-workspace/markdown/test-markdown-cweijan-571-codeblock-line-spacing.md` 查看各代码块行距;再在编辑器设置面板调大字号,确认代码块行距随之放大。
