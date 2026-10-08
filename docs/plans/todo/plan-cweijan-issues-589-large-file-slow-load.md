# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/589

## 标题

The rendered Markdown document takes a long time to load.

## 标签

（无标签，报告者 yuxuan-7814，创建于 2026-08-20，当前 open）

## 问题描述-原文

I'm using CC and Office Viewer on VS Code. The current version is 4.1.3, but I've found that when I'm running a long CC task, clicking on a Markdown document results in an excessively long loading time, ranging from about 10 to 20 minutes.

## 问题评论信息

无评论。

## 问题描述-中文

「我在 VS Code 上同时使用 CC 和 Office Viewer。当前版本是 4.1.3，但我发现：当我正在运行一个较长的 CC 任务时，点击打开一个 Markdown 文档会导致过长的加载时间，大约在 10 到 20 分钟。」

正文无截图、无附件。

## 问题评论信息-中文

无。

## 补充归纳（非原文）

以下为本仓库分析归纳，非 issue 原文：

- CC 推断指 Claude Code；
- 合理推断：CC 长任务会持续向 markdown 文件（任务日志/报告）追加写入，产生大体积文档；加载缓慢可能与大文档整体渲染有关，也可能与"文件被持续写入时扩展监听 `fileChange` 反复触发重载/重渲染"有关（两者叠加更甚）；
- 勘误：本 plan 旧版转写称「未附文件与环境细节」，与原文有出入——正文实际写明扩展版本为 4.1.3，未附的是复现文件、截图、日志等其余细节。

## 期望行为

大 markdown 文档应在秒级完成打开并可交互（或渐进渲染）；文件持续被外部写入时不应反复整页重载放大卡顿。

## 实际行为

点击 markdown 文档后约 10-20 分钟才完成加载。

# 问题确认及解决

## 复现数据

复现文件：`test-workspace/markdown/test-markdown-cweijan-589-large-file-slow-load.md`
生成脚本：`test-workspace/_generate-script/issue_589_large_file_slow_load.py`

文件内容说明：程序生成约 5MB 的混合结构 markdown（标题层级 + 段落 + 列表 + 表格 + 代码块，模拟 CC 长任务输出的长文档），行数/体积可在脚本头部参数调整。分两个场景验证：

- **场景 A（纯大文件）**：静态打开，测从点击到可交互的耗时；
- **场景 B（边写边开，模拟 CC）**：打开期间用脚本持续向另一同规格文件追加写入，观察是否反复重载、卡顿是否放大。

### 复现步骤

1. F5 调起扩展调试；
2. 场景 A: 打开 `test-markdown-cweijan-589-large-file-slow-load.md`，记录点击 → 可交互耗时；
3. 场景 B: 运行 `python test-workspace/_generate-script/issue_589_large_file_slow_load.py --append` 使目标文件持续追加写入，期间（重新）打开该文件观察行为；
4. 预期：场景 A 秒级打开；场景 B 不因写入监听反复整页重载；
   实际（按 issue）：加载耗时分钟级（10-20 分钟）。

注：5MB 未必达到 issue 的复现体量（CC 长任务日志可能远大于此），若 5MB 下现象不明显，逐步调大脚本参数（10MB/50MB）再测；同时关注 webview 内存与主进程消息传输的耗时占比。

## 根因定位

**已定位。把「点击打开到可交互」的链路拆成四个环节逐一评估：③「文件持续写入时反复整页重载」是分钟级耗时的主因；②「整篇全量解析渲染」是每次重载都要重付的基础成本（放大器）；①「数据读取与传输」、④「宿主侧阻塞」排除。**

> **术语说明**（下文反复出现，先统一注释）：
> - **CC**：Claude Code，其长任务会持续向 markdown 文件（任务日志/报告）追加写入，频率为亚秒到秒级；
> - **webview**：VS Code 中承载编辑器界面的网页视图，与扩展宿主之间靠 postMessage 消息通信，每次传内容都要序列化整份字符串；
> - **防抖（debounce）**：事件在短时间内连续触发时，只处理最后一次、丢弃中间次的常用手法；
> - **Lute / vditor**：vditor 是本项目使用的 Markdown 编辑器组件，Lute 是它内置的 Markdown 解析器（Go 实现转译为 JS），负责 md 文本与显示 DOM 的双向转换；
> - **undo 栈快照**：撤销历史。每次内容变化会把整棵编辑 DOM 复制存档，大文档上这一步成本可观。

### 打开与重载的链路事实（读码确认）

- **打开**：宿主一次性读入全文（[markdownEditorProvider.ts:163](../../../src/provider/markdownEditorProvider.ts#L163) 的 `document.getText()`）→ 把整份内容发给 webview（L213-224）→ 编辑器初始化时整篇交给 Lute 解析、一次性挂载 DOM（[EditMode.ts:99-113](../../../vditor/src/ts/toolbar/EditMode.ts#L99-L113)、[renderDomByMd.ts:24-26](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts#L24-L26)）——**没有分块、虚拟化或渐进渲染，文件多大就一次渲染多少**；
- **文件被持续写入时**：文件刚打开、用户还没编辑 → 文档没有未保存修改 → VS Code 检测到磁盘变化就自动重载文档 → 每次追加都触发内容变更事件（[handler.ts:43-47](../../../src/common/handler.ts#L43-L47)）→ 宿主的 externalUpdate 处理（[markdownEditorProvider.ts:227-233](../../../src/provider/markdownEditorProvider.ts#L227-L233)）。**这条链路没有任何防抖或节流**（对比：webview→宿主的保存有 400ms 防抖，L204），每次事件都做全文比较，然后把整份新内容发给 webview 重渲染。（`fileChange` 事件宿主侧无监听者，不参与；真正的触发者是 VS Code 的文档重载。）

### 四个环节的判定

**① 数据读取与传输——非主因。** 读全文一次线性扫描；发送 5MB 字符串的序列化约 100-300ms；后续每次重载再传一次全文，同量级。整体毫秒～百毫秒级，单独不可能造成分钟级。

**② 全量解析渲染——每次的基础成本（放大器）。** 没有懒渲染：整篇 Lute 解析 + 整篇一次性建 DOM（生成的 HTML 约为原文数倍）+ [renderDomByMd.ts:34-62](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts#L34-L62) 的全量后处理 + 大纲目录全量遍历；唯一例外是普通代码块会等滚动到可见时才挂 CodeMirror 编辑器（[codeMirrorManager.ts:512-527](../../../vditor/src/ts/codeBlock/codeMirrorManager.ts#L512-L527)），数学/mermaid 块仍即时渲染。5MB 单次渲染即秒～十秒级，更大体量可达分钟级。且每次渲染后，撤销栈还要完整复制整棵 DOM、再做两份全文 HTML 的 diff（[undo/index.ts:250-290](../../../vditor/src/ts/undo/index.ts#L250-L290)、[undo/index.ts:134-142](../../../vditor/src/ts/undo/index.ts#L134-L142)）——又一次全量级开销。

**③ 持续写入时的整页重载——主因（分钟级耗时的来源）。** 每次磁盘追加都完整走一遍：宿主读全文、归一换行、比较 → 5MB 消息发给 webview → webview 先判断「新内容与我当前内容是否一致」——这个判断本身就要把整棵 DOM 反序列化回 markdown 全文（[getMarkdown.ts:6-43](../../../vditor/src/ts/markdown/getMarkdown.ts#L6-L43)）——必然不等 → 整篇重设内容、全量重渲染（把②的成本再付一遍，外加撤销栈全量快照）。**即每次追加要付出约 5 次以上「全文量级」的 CPU 工作，全部阻塞 webview 主线程**；渲染耗时一旦超过追加间隔，消息队列持续堆积，编辑器永远追不上最新内容——表现正是「打开 10-20 分钟才可交互」，且文件越大单次越慢，累计代价近似「体量 × 追加次数」。另：用户若边开边编辑，保存链的样式还原还有两次全文 Lute 往返（[styleRestore.js:132-152](../../../resource/markdown/styleRestore.js#L132-L152)），进一步放大。

**④ 宿主侧同步阻塞——排除。** 宿主侧全部是线性复杂度的字符串操作（读全文、替换、切分，毫秒级），没有逐字符处理、没有同步的大 JSON 解析；瓶颈在 webview 主线程而非扩展宿主（仅远程场景下高频 5MB 消息会加剧拥塞）。

**结论：场景 A（纯大文件静态打开）慢在②；场景 B（CC 边写边开，即 issue 实际场景）慢在③×②复合——高频全量重载叠加全量渲染，10-20 分钟可以得到解释。**

## 修复方案

按收益/风险排序（暂不实施）：

1. **给 externalUpdate 加防抖（宿主侧，小改动，直接消掉③）**：[markdownEditorProvider.ts:227-233](../../../src/provider/markdownEditorProvider.ts#L227-L233) 给 externalUpdate 增加防抖（500ms-1s，实现上与保存侧的 `scheduleDocumentSync` 对称；仅当本地没有待同步的编辑时启用），中间的版本丢弃、只处理最新一次；
2. **纯追加走增量快速通道（宿主+webview）**：宿主检测新内容是否为「旧内容 + 追加」（`updatedText.startsWith(content)`，CC 追加日志的典型形态），是则改发增量消息；webview 侧 [index.js](../../../resource/markdown/index.js) 增加对应的 append 处理，调用 vditor 新增的 `appendMarkdown(delta)`（在 [renderDomByMd.ts](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts) 旁实现：只解析增量、追加到文档末尾，不做整树重建），滚动位置与已渲染内容零破坏；非追加形态回退现有的全量更新；
3. **webview 更新前的比较降耗**：[index.js:280](../../../resource/markdown/index.js#L280) 维护「上次同步的内容 + 本地是否有未同步编辑」两个标志，本地无编辑时跳过 `getValue()` 全文反序列化，直接应用新内容；有编辑且为追加形态时走方案 2；
4. **超大文件兜底（产品层）**：[markdownEditorProvider.ts:133](../../../src/provider/markdownEditorProvider.ts#L133) 打开前检查文件大小（如 >5MB），超过时提示用户并默认改用 VS Code 内置文本编辑器打开（或只读模式 + 关闭大纲/撤销）；
5. **大文档撤销栈减负**：vditor 的 [setValue](../../../vditor/src/index.ts#L390-L427) 对程序化更新跳过撤销栈记录（`enableAddUndoStack: false`，或按已有的 5 万字符阈值跳过全 DOM 复制），避免每次重渲染再付一次全量快照成本。

方案 1+2 落地后，场景 B 从「每次追加全量重渲染」变成「防抖后只追加增量」，是质变；方案 4 是极端体量的兜底。

## 验证方式

对应「复现步骤」：

- 场景 A:打开 5MB 静态文件，记录点击→可交互耗时作基线；本方案主要不针对该场景，预期小改善（方案 5 生效）；
- 场景 B:`python test-workspace/_generate-script/issue_589_large_file_slow_load.py --append` 持续追加期间（重新）打开文件：方案 1 生效后不再逐次全量重载（webview console 加计数或用 DevTools Performance 观察重渲染次数），方案 2 生效后追加期间滚动位置保持、已渲染内容不闪烁重建；5MB 下现象不明显则调大至 10MB/50MB 复测；
- 量化口径：点击→首次可输入耗时、追加期间每秒重渲染次数、webview 进程内存曲线，修复前后各记录一轮。

回归项：

- 常规小文件（#601 等）打开、编辑、保存行为不变；
- 外部程序**全量覆写**文件（非追加形态）时编辑器内容仍正确全量更新；
- Ctrl+S 手动保存链路（doSave → `workbench.action.files.save`）不受 externalUpdate 防抖影响；
- 多个 webview 同时打开同一文件互不干扰（blockScroll/文档缓存行为不变）。
