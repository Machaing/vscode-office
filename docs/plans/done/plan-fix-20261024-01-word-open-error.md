# Word 打开失败两类报错(HYPERLINK 域目录渲染崩溃 / .doc 冒名 .docx)

> 创建: 2026-10-24 · 来源: 本地实测报告(用户以 4.2.2 安装版打开两份工作文档时触发,非上游 issue)

## 问题描述(报告原文)

以下两份 word 文件都无法打开:

1、`test-workspace\word\xxxplan-1.docx`(原始文件,现已改名 `test-word-open-hyperlink-toc.orig.docx`)

```
Something went wrong
An error occurred while rendering this component. Please try again or contact support if the problem persists.

Error: Cannot read properties of undefined (reading 'filter')

Component Stack:
    at https://file+.vscode-resource.vscode-cdn.net/.../out/webview/assets/Word-D9-lmdau.js:166:55705
    at div (<anonymous></anonymous>)
    at https://file+.vscode-resource.vscode-cdn.net/.../out/webview/assets/Word-D9-lmdau.js:166:106116
```

2、`test-workspace\word\xxxplan-2.docx`(原始文件,现已改名 `test-word-open-doc-as-docx.orig.docx`)

```
Failed to Load Document
Failed to parse DOCX: Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html
```

## 复现数据

最小复现文件与生成脚本(等价还原原始文档的触发特征,体积从 14MB/9.9MB 缩到 KB 级):

| 复现文件 | 生成脚本 | 对应问题 |
| --- | --- | --- |
| `word/test-word-open-hyperlink-toc.docx`(2.2KB) | [word_open_error.py](../../../test-workspace/_generate-script/word_open_error.py) | 问题一 |
| `word/test-word-open-doc-as-docx.docx`(4KB) | 同上 | 问题二 |

原始实测文档因体积大(14MB / 9.9MB)不入库,改名 `*.orig.docx` 后由 .gitignore 排除,本地保留供 F5 实测;两者与最小复现的对应关系及取材说明见生成脚本文件头注释。

### 复现步骤

1. F5 调起扩展调试,依次打开两个最小复现文件;
2. 预期(修复后):文件一正常渲染出目录与正文;文件二展示中文友好提示,说明文件格式与扩展名不符;
3. 实际(修复前):文件一弹 "Something went wrong" 崩溃面板;文件二弹库内英文面板,仅见 JSZip 的技术报错。

# 问题确认及解决

术语说明:

- **complexField(复杂域)**:Word 用 `fldChar begin/separate/end` 三个字符界定的域结构,解析后成为 AST 节点,显示内容在 `fieldResult`(域结果)数组,域指令在 `fieldCode`;它与 `hyperlink`(超链接元素)、`run`(文本行)同为段落内的行级节点
- **ProseMirror 转换**:把解析出的文档 AST 转成编辑器内部文档模型的过程,发生在 React 渲染期(同步执行),抛错即被库内错误边界拦截并显示 "Something went wrong"
- **可见性检测**:转换时用于判断段落首/尾是否需要分页的逻辑,即下文的 V 函数
- **魔数**:文件开头若干字节标识真实格式的签名,如 zip 为 `PK\x03\x04`,OLE2 复合文档为 `D0 CF 11 E0 A1 B1 1A E1`

## 根因定位

### 问题一:HYPERLINK 域代码形式的目录触发渲染崩溃

**这是 issue-597 本地补丁与上游库转换代码的组合缺陷。** 597 补丁让解析器正确保留「域中域」结构(目录条目 HYPERLINK 域的 `fieldResult` 里含有 PAGEREF 域的内层 complexField 节点),而上游 `@eigenpal/docx-editor-core@1.9.0` 转换期的可见性检测函数 V 从未预期这种嵌套结构,对非 run 节点一律取 `children.filter`,complexField 节点没有 `children` 字段(子内容在 `fieldCode`/`fieldResult`),于是抛出与报错截图一致的 `TypeError: Cannot read properties of undefined (reading 'filter')`。

**触发结构与文档特征。** 原始文件是 WPS 生成的 14MB 工作文档,解析阶段完全正常(Node 侧 headless 解析得到 4 个 section、462 个内容块、页眉部件齐全)。触发点在目录,整份目录位于内容控件(`blockSdt`,170 个段落)内,每个条目段落的形式与常见 Word 文档不同:

- 常见 Word 目录条目用 `<w:hyperlink>` 元素包裹标题文本与 PAGEREF 域,解析后是 `hyperlink` 节点带 `children`;
- 本文档条目用 **HYPERLINK 域代码**(`fldChar` 界定的 `HYPERLINK \l "_TocXXXX"` 域)实现跳转,解析后段落内容的顶层节点是 complexField,其 `fieldResult` 数组为 `[run(标题文本), run(制表符), complexField(PAGEREF 域)]`,即域结果里嵌套了内层域。

**崩溃链路。** webview 的 Word 查看器把文件交给 [Word.tsx](../../../src/react/view/word/Word.tsx) 里的 `DocxEditor` 组件后,库在渲染期把 AST 转成 ProseMirror 文档。转换每个段落时会先做可见性检测以判断分页,承担该职责的函数 V(`@eigenpal/docx-editor-core` 1.9.0 的 `dist/chunk-Z7YMXEOX.js`,ESM 构建对应 `dist/chunk-JHTTIFGA.mjs`)原始实现是:

```js
function V(e,n){for(let o of e)o.type==="run"?ye(o.content,n):V(o.children.filter(l=>l.type==="run"),n)}
```

上层的域分发逻辑 `Pe` 遇到 complexField 时,把 `fieldCode` 与 `fieldResult` 展开后整体传给 V。展开后的数组里混着内层 PAGEREF 的 complexField 节点,V 对它取 `o.children.filter` —— `children` 是 undefined,TypeError 就此抛出。该错误发生在 React 渲染期(组件栈两帧即编辑器组件与页面容器组件),被库内错误边界捕获,显示为 "Something went wrong" 面板,查看器完全不可用。

**为什么 597 修复后才出现、且 597 自己的复现文件不触发。** 「fieldResult 内嵌套 complexField」这个 AST 结构正是 597 补丁引入的,补丁前它不存在,因此 V 的缺陷从未暴露。2026-09-12 的 597 补丁(commit dce5e9d,详见 [plan-cweijan-issues-597-word-toc.md](../done/plan-cweijan-issues-597-word-toc.md))修的是解析期域状态机:上游实现对嵌套域会清空外层域的 `fieldResult`,导致目录条目文本丢失;补丁让内层域闭合时以内层 complexField 节点的形式并入外层域结果,修复了文本丢失,却也把 V 没见过的嵌套结构送进了转换期。597 自己的复现文件不触发本次崩溃,是因为它按常见 Word 结构用 `<w:hyperlink>` 元素构造目录(实测该文件 AST 中 complexField 数量为 0),529 的复现文件虽有 6 个 complexField 但不存在嵌套;两者的回归通过不代表本结构安全,这是当时验证的盲区。

**定位与验证过程。** 全部结论经 Node 侧实测确认,与 webview 使用同一份解析/转换代码:

1. headless `parseDocx` 加载原始 14MB 文件,解析成功;对解析结果调用 `toProseDoc`(ProseMirror 转换入口,`@eigenpal/docx-editor-core/dist/prosemirror/conversion`)抛出同款 TypeError,复现 webview 报错;
2. 给 V 临时加日志重跑,确认肇事元素就是 `PAGEREF _TocXXXX \h` 的 complexField 节点(无 `children` 字段);
3. 按「类型分派」语义修复 V(见下节)后重跑,原始文件转换成功(462 块,文档模型 nodeSize 14113),最小复现文件与全部 7 个既有 word 测试文件(sample、597 两组、311、497、529)亦全部通过,无回归。

### 问题二:.doc 冒名 .docx 时只有 JSZip 技术报错

**文件本身名不符实,责任不在扩展 —— 内容是 Word 97-2003 二进制格式(.doc),扩展名却是 .docx,扩展无法也不应渲染它;要修的是报错信息没有把这一点告诉用户。**

原始文件(9.9MB)的文件头是 OLE2 复合文档签名 `D0 CF 11 E0 A1 B1 1A E1`,偏移 0x08 处的类标识(CLSID)`00020906-0000-0000-C000-000000000046` 对应 `Word.Document.8`,即 Word 97-2003 的 .doc 二进制格式。docx 本质是 zip 压缩包,JSZip 在文件里找不到 zip 的中央目录(end of central directory),于是报出截图中的英文错误。

报错呈现的链路里,[Word.tsx](../../../src/react/view/word/Word.tsx#L89-L110) 的 `loadDocument` 只捕获「从扩展宿主取文件内容」和「TIFF 媒体转换」两步的错误;[tiffMedia.ts](../../../src/react/view/word/tiffMedia.ts#L84-L89) 遇到非 zip 内容时静默返回原样字节。于是 buffer 原封不动进入 `DocxEditor`,解析失败发生在库组件内部,弹的是库自带的英文错误面板("Failed to Load Document" + JSZip 报错原文),用户无从知道「改个扩展名就能解决」。

另需说明,扩展的 `customEditors` selector 只声明了 `.docx`/`.dotx`,`.doc` 本就不在支持范围内(旧版二进制格式没有可用的浏览器端解析方案),所以本问题的目标不是渲染该文件,而是给出说明原因的友好提示。

## 修复方案

问题一在依赖补丁层修复,问题二在本仓库 webview 层修复,共三处改动:

1. **补丁追加 V 函数修复**(问题一根因修复):在 [patches/@eigenpal__docx-editor-core.patch](../../../patches/@eigenpal__docx-editor-core.patch) 追加对 `dist/chunk-Z7YMXEOX.js` 与 `dist/chunk-JHTTIFGA.mjs`(同一代码的 CJS/ESM 两种产物,webview 构建取 ESM)的修改,把 V 的「非 run 一律取 children」改为按类型分派 —— complexField 展开 `fieldCode`/`fieldResult` 递归,simpleField 取 `content`,hyperlink 取 `children`,其余节点有 `children` 才递归。补丁机制沿用 597 已有的 `pnpm-workspace.yaml` `patchedDependencies` 配置,无需新增配置项。
2. **打开前的魔数检测**(问题二的友好提示):[Word.tsx](../../../src/react/view/word/Word.tsx) 的 `loadDocument` 在把 buffer 交给 `DocxEditor` 之前检查文件头,字节以 `D0 CF 11 E0` 开头时提示「文件内容是旧版 Office 二进制格式(如 Word 97-2003 的 .doc),与 .docx 扩展名不符;请用 Word/WPS 另存为 .docx,或将扩展名改回 .doc」;其余非 `PK` 开头的内容提示「文件内容不是有效的 docx(zip)文档」。提示文案加入 [src/react/i18n/messages/](../../../src/react/i18n/messages/) 全部 10 个语言文件。命中检测时调用 `setError`,经已有的 Alert 展示提示,不再让文件进入库内解析。
3. **`onError` 回调转发**(兜底):给 `DocxEditor` 传 `onError`,`error.message` 经 `setError` 转到本扩展自己的 Alert,后续再遇到库内解析失败时用户看到的是统一的错误面板,而不是库的英文面板(与 Excel 侧 issue-576 的处理思路一致)。

## 修复记录(已实施)

已于 2026-10-24 实施上述方案,变更文件:

- `patches/@eigenpal__docx-editor-core.patch` + `pnpm-workspace.yaml`(经 `pnpm patch` / `pnpm patch-commit` 流程追加):V 函数修复同时落入 CJS(`chunk-Z7YMXEOX.js`)与 ESM(`chunk-JHTTIFGA.mjs`)两份产物,补丁后包内容哈希变化,pnpm 以新目录重装;
- [Word.tsx](../../../src/react/view/word/Word.tsx):新增 `detectDocxMagicError` 魔数检测(附成因注释),`loadDocument` 在 TIFF 转换前拦截,`DocxEditor` 增挂 `onError`;
- `src/react/i18n/messages/*.ts`(10 个语言文件):`viewer` 段新增 `notDocxZip`、`legacyOfficeBinary` 两键。

## 验证方式

Node 侧(与 webview 同一份解析/转换代码)已完成全部验证,修复前后对照:

| 文件 | 修复前(V 原版) | 修复后(补丁实施后复验) |
| --- | --- | --- |
| 最小复现 test-word-open-hyperlink-toc.docx | `toProseDoc` 抛 `Cannot read properties of undefined (reading 'filter')` | 转换成功(3 块) |
| 原始实测文档(14MB,.orig.docx) | 同上 | 转换成功(462 块,含页眉) |
| sample.docx / sample.dotx / 597 两组 / 311 / 497 / 529(共 7 个) | 正常 | 正常,无回归 |
| 最小复现 test-word-open-doc-as-docx.docx | `parseDocx` 抛 `Failed to parse DOCX: Can't find end of central directory...` | 魔数检测生效后不再进入库内解析,展示中文提示 |

其余验证:

1. `pnpm patch-commit` 后确认 node_modules 新目录内两份产物均含修复;`npm run build` 构建通过,且 `out/webview/assets/Word-*.js` 产物中压缩重命名后的 V(产物内为 `qB`)完整保留 complexField 分派、hyperlink 兜底 `??[]` 与 `children&&` 防御,证明 ESM 补丁链路贯通;
2. `npm run lint:fix` 通过(仅遗留 576 记录过的既有 exhaustive-deps 警告);i18n 10 个语言文件键齐全;
3. dev 模式注意:vite 对 `@eigenpal/docx-editor-react` 有依赖预构建缓存(`node_modules/.vite/deps`),补丁落地后已删除该缓存,正在运行的 dev server 需重启(`npm run dev` + 重新 F5)才会加载修复后的库代码;
4. F5 实测四个文件(两个最小复现 + 两个 `.orig.docx` 原始文档)通过后随 4.2.3 发版(2026-10-25),.vsix 本地安装即含全部修复。

## 归档

2026-10-25 修复随 4.2.3 发布,plan 由 todo/ 归档至 done/,复现文件登记表的链接已同步。
