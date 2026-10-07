# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/589

## 标题

The rendered Markdown document takes a long time to load.

## 标签

(无标签,报告者 yuxuan-7814,创建于 2026-08-20,当前 open)

## 问题描述-原文

I'm using CC and Office Viewer on VS Code. The current version is 4.1.3, but I've found that when I'm running a long CC task, clicking on a Markdown document results in an excessively long loading time, ranging from about 10 to 20 minutes.

## 问题评论信息

无评论。

## 问题描述-中文

「我在 VS Code 上同时使用 CC 和 Office Viewer。当前版本是 4.1.3,但我发现:当我正在运行一个较长的 CC 任务时,点击打开一个 Markdown 文档会导致过长的加载时间,大约在 10 到 20 分钟。」

正文无截图、无附件。

## 问题评论信息-中文

无。

## 补充归纳(非原文)

以下为本仓库分析归纳,非 issue 原文:

- CC 推断指 Claude Code;
- 合理推断:CC 长任务会持续向 markdown 文件(任务日志/报告)追加写入,产生大体积文档;加载缓慢可能与大文档整体渲染有关,也可能与"文件被持续写入时扩展监听 `fileChange` 反复触发重载/重渲染"有关(两者叠加更甚);
- 勘误:本 plan 旧版转写称「未附文件与环境细节」,与原文有出入——正文实际写明扩展版本为 4.1.3,未附的是复现文件、截图、日志等其余细节。

## 期望行为

大 markdown 文档应在秒级完成打开并可交互(或渐进渲染);文件持续被外部写入时不应反复整页重载放大卡顿。

## 实际行为

点击 markdown 文档后约 10-20 分钟才完成加载。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-589-large-file-slow-load.md`
生成脚本: `test-workspace/_generate/issue_589_large_file_slow_load.py`

文件内容说明: 程序生成约 5MB 的混合结构 markdown(标题层级 + 段落 + 列表 + 表格 + 代码块,模拟 CC 长任务输出的长文档),行数/体积可在脚本头部参数调整。分两个场景验证:

- **场景 A(纯大文件)**: 静态打开,测从点击到可交互的耗时;
- **场景 B(边写边开,模拟 CC)**: 打开期间用脚本持续向另一同规格文件追加写入,观察是否反复重载、卡顿是否放大。

### 复现步骤

1. F5 调起扩展调试;
2. 场景 A: 打开 `test-markdown-cweijan-589-large-file-slow-load.md`,记录点击 → 可交互耗时;
3. 场景 B: 运行 `python test-workspace/_generate/issue_589_large_file_slow_load.py --append` 使目标文件持续追加写入,期间(重新)打开该文件观察行为;
4. 预期: 场景 A 秒级打开;场景 B 不因写入监听反复整页重载;
   实际(按 issue): 加载耗时分钟级(10-20 分钟)。

注: 5MB 未必达到 issue 的复现体量(CC 长任务日志可能远大于此),若 5MB 无感,逐步调大脚本参数(10MB/50MB)再测;同时关注 webview 内存与主进程 IPC 传输耗时占比。

## 根因定位

**已定位(四环节逐一评估:③为主因,②为放大基线,①④排除)**。

链路事实(读码确认):

- 打开:宿主 `document.getText()` 一次性读全文([markdownEditorProvider.ts:163](../../../src/provider/markdownEditorProvider.ts#L163))→ `handler.emit("open", {content…})`(L213-224);webview `new Vditor({value: content})` → `setEditMode` → `renderDomByMd`([EditMode.ts:99-113](../../../vditor/src/ts/toolbar/EditMode.ts#L99-L113))→ `lute.Md2VditorDOM(md)` 整篇解析 + `editorElement.innerHTML = html` 整篇建 DOM([renderDomByMd.ts:24-26](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts#L24-L26)),**无分块/虚拟化/渐进渲染**;
- 持续写入时(文件刚打开、用户未编辑 → TextDocument 干净 → VS Code 检测到盘上变化自动重载文档):每次追加都触发 `onDidChangeTextDocument` → [handler.ts:43-47](../../../src/common/handler.ts#L43-L47) → 宿主 `on("externalUpdate")`([markdownEditorProvider.ts:227-233](../../../src/provider/markdownEditorProvider.ts#L227-L233))。**这条链路没有任何防抖/节流**(对比:webview→宿主的 save 有 400ms 防抖 L204),每次事件都全文比较后 `emit("update", updatedText)` 下发。(`fileChange` 事件宿主侧无监听者,不参与;真正的触发者是 VS Code 的文档重载。)

四环节判定与依据:

**① 宿主读取与 postMessage 传输——非主因**。`getText()` O(n) 一次;`emit("open")` 的 5MB 字符串 structured-clone 约 100-300ms;后续每次 externalUpdate 再传一次全文(同量级)。整体毫秒~百毫秒级,单独不可能造成分钟级。

**② vditor/lute 全量解析渲染——基线主成本(放大器)**。无 lazy render:整篇 Md2VditorDOM(Lute/GopherJS 解析)+ 整篇 innerHTML 解析(生成 HTML 约为原文数倍)+ [renderDomByMd.ts:34-62](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts#L34-L62) 的全量 `querySelectorAll` 后处理 + outline/toc 全量遍历;唯一例外是普通代码块经 IntersectionObserver 懒挂 CodeMirror([codeMirrorManager.ts:512-527](../../../vditor/src/ts/codeBlock/codeMirrorManager.ts#L512-L527)),数学/mermaid 块仍即时渲染。5MB 单次渲染即秒~十秒级,更大体量可达分钟级。且每次渲染后 `afterRenderEvent → recordHistory → addToUndoStack → addCaret`([undo/index.ts:250-290](../../../vditor/src/ts/undo/index.ts#L250-L290))会 `cloneNode(true)` 整棵编辑 DOM 并序列化 innerHTML,再对两份全文 HTML 串做 `dmp.diff_main`([undo/index.ts:134-142](../../../vditor/src/ts/undo/index.ts#L134-L142))——又一次全量级开销。

**③ 边写边开的重载策略——主因(分钟级耗时的来源)**。每次盘上追加(CC 写日志频率为亚秒~秒级)走完整链:宿主全文 getText + `replace(/\r/g)` + 比较 + `updateCount` split → 5MB postMessage → webview `handler.on("update")`([index.js:274-285](../../../resource/markdown/index.js#L274-L285))先做 `getMarkdownValue() === content` 比较——这本身就要 `editor.getValue()` = **整棵 DOM 序列化 + Lute VditorDOM2Md 全文反解析**([getMarkdown.ts:6-43](../../../vditor/src/ts/markdown/getMarkdown.ts#L6-L43))——判不等 → `editor.setValue(content)` 全量重渲染(回到②的全部成本 + undo 全量快照)。即**每次追加 ≈ 5 次以上全文量级的 CPU 工作,全部阻塞 webview 主线程**;渲染耗时 > 追加间隔时 postMessage 队列持续堆积,编辑器永远追不上最近一次内容,表现即「打开 10-20 分钟才可交互」,且文件越大单次越慢,累积代价近似 O(体量 × 追加次数)。另:用户若边开边编辑,保存链 styleRestorer 的 `canonicalize` 还有两次全文 Lute 往返([styleRestore.js:132-152](../../../resource/markdown/styleRestore.js#L132-L152)),进一步放大。

**④ 同步阻塞宿主的操作——排除**。宿主侧全部是 O(n) 字符串操作(getText、replace、split,毫秒级),无逐字符处理、无同步大 JSON 解析;瓶颈在 webview 主线程而非扩展宿主(仅 remote 场景下高频 5MB IPC 会加剧拥塞)。

结论:场景 A(纯大文件静态打开)慢在②;场景 B(CC 边写边开,即 issue 实际场景)慢在③×②复合——高频全量重载叠加全量渲染,10-20 分钟可合理解释。

## 修复方案

按收益/风险排序(不实施):

1. **externalUpdate 防抖(宿主,小改动,直接砍③)**:[markdownEditorProvider.ts:227-233](../../../src/provider/markdownEditorProvider.ts#L227-L233) 给 externalUpdate 增加 trailing 防抖(500ms-1s,实现上与 save 侧的 `scheduleDocumentSync` 对称;无本地 pending 编辑时才启用),中间版本丢弃、只保最新;
2. **纯追加快速通道(宿主+webview)**:宿主检测 `updatedText.startsWith(content)`(CC 追加日志的典型形态)时改发 `emit("append", delta)`;webview 侧 [index.js](../../../resource/markdown/index.js) 增加 append handler,调用 vditor 新增的 `appendMarkdown(delta)`(在 [renderDomByMd.ts](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts) 旁实现:仅解析增量、append 到 `vditor-reset` 末尾,不做整树 innerHTML 替换),滚动与已渲染内容零破坏;非追加形态回退现有全量 update;
3. **webview update 比较降耗**:[index.js:280](../../../resource/markdown/index.js#L280) 维护「上次同步内容 + 本地是否有未同步编辑」标志,无本地编辑时跳过 `getMarkdownValue()` 全文反序列化直接应用新内容;有编辑且为追加时走方案 2;
4. **大文件降级阈值(产品兜底)**:[markdownEditorProvider.ts:133](../../../src/provider/markdownEditorProvider.ts#L133) `resolveCustomTextEditor` 前置检查文件大小(如 >5MB),超过时提示并默认改用 VS Code 内置文本编辑器打开(或只读 + 关闭 outline/undo);
5. **大文档 undo 减负**:[index.ts setValue](../../../vditor/src/index.ts#L390-L427) 对程序化更新走 `enableAddUndoStack: false`(或按 `configureHistoryDeferByDocumentLength` 已有的 50k 字符阈值跳过 addCaret 全 DOM clone),避免每次重渲染再付一次全量快照成本。

方案 1+2 实施后,场景 B 从「每次追加全量重渲染」变为「防抖后仅追加增量」,是质变;方案 4 为极端体量兜底。

## 验证方式

对应「复现步骤」:

- 场景 A:打开 5MB 静态文件,记录点击→可交互耗时作基线;本方案主要不针对该场景,预期小改善(方案 5 生效);
- 场景 B:`python test-workspace/_generate/issue_589_large_file_slow_load.py --append` 持续追加期间(重新)打开文件:方案 1 生效后不再逐次全量重载(webview console 加计数或用 DevTools Performance 观察重渲染次数),方案 2 生效后追加期间滚动位置保持、已渲染内容不闪烁重建;5MB 无感则按 plan 提示调大至 10MB/50MB 复测;
- 量化口径:点击→首次可输入耗时、追加期间每秒重渲染次数、webview 进程内存曲线,修复前后各记录一轮。

回归项:

- 常规小文件(#601 等)打开、编辑、保存行为不变;
- 外部程序**全量覆写**文件(非追加形态)时编辑器内容仍正确全量更新;
- Ctrl+S 手动保存链路(doSave → `workbench.action.files.save`)不受 externalUpdate 防抖影响;
- 多个 webview 同时打开同一文件互不干扰(blockScroll/文档缓存行为不变)。
