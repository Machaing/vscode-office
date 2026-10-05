# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/575](https://github.com/cweijan/vscode-office/issues/575)

## 标题

[BUG] md 表格显示没有按页面宽度自适应

## 标签

bug

## 问题描述

2026-08-01 由 belonliu 报告，环境 OS: Windows/Linux，Extension Version: 4.1.8。

报告者原话(未按模板分节)："md 中的表格显示没有按页面宽度自适应（文字显示没问题），单元格里面的文字不应该换行，缺发生了换行"。即：正文文字显示正常，但表格没有按页面宽度自适应展示，单元格内本不应换行的文字发生了换行。

- 正文未提供复现步骤、代码示例与期望/实际行为分节，无截图说明。
- 截至抓取时无任何评论，无维护者结论。

## 期望行为

(推断)表格按页面宽度自适应展示：单元格内的长文字不换行，表格通过压缩列宽至最小内容宽度、整体横向滚动等方式容纳超出部分，不出现单元格内折行。

## 实际行为

表格未按页面宽度自适应，单元格内的文字发生了不应有的换行。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-575-table-width-adapt.md`
生成脚本: 文本文件,直接维护

文件内容说明: 构造三种表格场景：常规宽度表格(对照)、总宽超出页面宽度的多列宽表格(中英文长内容)、单元格内长内容无空格(不可自然断行)的表格。宽表格的单元格文字在正常渲染下要么不换行(期望)，要么被折行(issue 现象)。

### 复现步骤

1. F5 调起扩展调试，打开复现文件；
2. 查看宽表格的显示效果(可调整编辑器窗口宽度)；
3. 预期: 单元格内长文字不换行，表格按页面宽度自适应(压缩列宽或横向滚动)；实际: 单元格内文字发生了不应有的换行。

## 根因定位

### 样式链

Markdown 预览走独立 vditor webview(`resource/markdown/index.html`),加载顺序:

1. `dist/index.css` —— vditor 子项目(`vditor/`)构建产物,由 `vditor/src/assets/less/index.less` 聚合编译,自动复制到 `resource/markdown/dist/`(gitignore,发版构建时再生成);
2. `index.css` —— 本地覆盖层,仅含右键菜单/帮助提示等 webview chrome 样式,**不含 table/code 规则**。

表格渲染样式在 `vditor/src/assets/less/_reset.less` 的 `.vditor-reset table`(所有编辑模式共用)。

### 根因

上游提交 a5ac09b「Support viewing office files in the Git view」(2026-06-22,随 4.1.8 前后发布)把表格规则从 `width:100%` + `td/th { white-space:nowrap }` 改为:

```less
table { display:block; word-break:keep-all; width:max-content; max-width:100%; overflow:auto; }
td, th { min-width:80px; max-width:300px; overflow-wrap:anywhere; word-break:break-word; white-space:normal; }
```

两个新约束破坏了自适应:

- `overflow-wrap:anywhere`:按 CSS 规范它**参与固有尺寸计算**,使单元格最小内容宽度(min-content)退化为约 1 个字符。叠加表级 `max-width:100%`,浏览器总能把任何宽度的表格压进容器宽度,并以逐字符断行的方式挤压单元格——"不该换行的文字发生了换行"。
- `max-width:300px`:把列宽上限锁死,即使页面很宽,长内容单元格也强制在 300px 处折行。

对照 GitHub GFM 基准:`table { display:block; width:max-content; max-width:100%; overflow:auto }`,td/th 无宽度与折行约束——列宽最小压缩到"最长不可断词"宽度,放不下时由 `overflow:auto` 横向滚动,决不逐字符断行。

## 修复方案

在 vditor 源码层修改(`resource/markdown/index.css` 无对应覆盖层,根子在 vditor):`vditor/src/assets/less/_reset.less` 的 `td,th` 规则中删除 a5ac09b 引入的三项约束 `max-width:300px` / `overflow-wrap:anywhere` / `word-break:break-word`,保留:

- `min-width:80px`:稀疏列的可读性下限;
- `white-space:normal`:防止 wysiwyg 容器 `pre.vditor-reset` 的 `white-space:pre-wrap` 继承进单元格;
- 表级 `word-break:keep-all`(历史行为,中文不在字符间折行)、`width:max-content + max-width:100% + overflow:auto`(与 GFM 完全一致的尺寸语义)。

修复后行为:窄表按内容自适应;内容超出可用宽度时表格占满可用宽度并优先在软断点(空格、连字符)折行,中文/无空格长串不再折行,列宽压到最小内容宽度后由表格横向滚动容纳。

## 修复记录(2026-09-14)

`vditor/src/assets/less/_reset.less`(`.vditor-reset table td,th`):

```diff
       td,
       th {
         padding: 6px 13px;
         border: 1px solid var(--table-border);
         min-width: 80px;
-        max-width: 300px;
-        overflow-wrap: anywhere;
-        word-break: break-word;
+        // 不限制单元格宽度、不允许 anywhere 折行:
+        // 否则表格被压进 100% 宽度内并逐字符折行(issue-575),
+        // 宽表格应压缩列宽至最小内容宽度,放不下时由 table 的 overflow:auto 横向滚动
         white-space: normal;
```

已手动执行 vditor 构建(`vditor/` 下 `vite build --mode production`)重建本地 `resource/markdown/dist/`(gitignore,package 构建时会自动再生成)。

## 验证方式

无头验证:静态服务仓库根目录 + chrome-devtools MCP 加载 `test-workspace/markdown-style-check/harness.html`(900px 页宽模拟编辑器可用宽度,引用真实 `resource/markdown/dist/index.css`,并以 `.sim-legacy` 作用域复刻修复前规则作同页对照),用 `getComputedStyle` + `Range.getClientRects` 度量(截图 `verify-table-and-codeblock.png`):

| 场景 | 修复后 | 修复前(复刻对照) |
| --- | --- | --- |
| 常规宽度表格 | 宽 322px,按内容自适应,无溢出,全部单行 | 相同 |
| 宽表格(9 列中英长内容) | 表块 778px(占满可用宽度),scrollWidth 1672 → 横向滚动;最长中英混合单元格 583px **单行不折**;仅 `REQ-1001Requirement`、`2026-09-01T12:00:00Z` 等含连字符 token 在连字符处折 2 行(UAX#14 标准断行,GitHub 同样行为) | 单元格被压至 107px、**折成 8 行**(逐字符断行)——即 issue 现象 |
| 无空格长路径 | 单行 583px + 横向滚动,不断行 | 折成 2 行(327px 处断开),无滚动 |

局限:纯 CSS/布局层验证,未在真实 VS Code webview 内 F5 实测。手动复验步骤: F5 调试扩展 → 打开 `test-workspace/markdown/test-markdown-cweijan-575-table-width-adapt.md` → 调整编辑器窗口宽度,确认宽表格单元格内长文字不折行、表格横向滚动。
