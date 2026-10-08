# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/570

## 标题

[BUG] markdown编辑器会突然跳到最顶端 (没按home键)

## 标签

bug(报告者 Weijiang-Xiong,创建于 2026-07-26,当前 open)

## 问题描述-原文

- OS: ubunt 22.04 (via ssh)
- Extension Version: 4.1.7

在编辑markdown的时候有时候打字快一些就会突然跳到顶端, 目前没找到稳定复现的规律.

## 问题评论信息

无评论

## 问题描述-中文

- 操作系统: ubunt 22.04(原文拼写如此,即 Ubuntu 22.04,经 SSH 连接);扩展版本: 4.1.7;
- 「在编辑 markdown 的时候,有时候打字快一些就会突然跳到顶端,目前没找到稳定复现的规律。」;
- 标题补充:「没按 home 键」——跳顶并非 Home 键等按键操作所致。

## 问题评论信息-中文

无

## 补充归纳(非原文)

(本仓库归纳,非 issue 原文:)

- 报告者未提供复现文件、输入内容样例或扩展日志,正文无进一步定位线索;
- issue 无评论、无维护者结论。

## 期望行为

快速连续输入时,视口应稳定跟随光标所在位置滚动,不发生非预期的滚动跳变。(推断;正文未明写期望)

## 实际行为

快速打字过程中编辑器视口会突然滚动到文档最顶端,打断输入;无稳定复现规律。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-570-scroll-jump-to-top.md`
生成脚本: 文本文件,直接维护

文件内容说明: 足够长的 markdown 文档(约 25 节标题 + 段落 + 代码块),保证编辑器出现可观的纵向滚动距离,使「视口跳到最顶端」现象可被观察;内容本身无特殊语法,长度是该 bug 的触发前提。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(以 Markdown Viewer/WYSIWYG 方式);
2. 滚动到文档中下部,将光标置于某个段落中间;
3. 在光标处连续快速输入字符(可夹杂删除、回车换行),持续 10 秒以上;
4. 预期: 视口始终保持在光标附近;实际: 期间视口会突然跳到文档最顶端(未按 Home 或任何滚动键);
5. 上游未找到稳定复现规律,可多次重复并变换输入节奏(纯英文/中英混输/含回车),同时记录跳变发生的时机(如是否与文件自动保存、语法高亮刷新、输入法候选确认同步),为根因定位积累线索。

## 根因定位

**已定位(代码级确认)**。不是按键/滚动事件问题,而是宿主↔webview 保存回环中的「陈旧回声竞态」:自己 `applyEdit` 触发的 `onDidChangeTextDocument` 回声被误判为外部修改,宿主把**旧内容**整体下发,webview 全量 `setValue` 重建 DOM,滚动容器内容被清空导致 scrollTop 归零。

完整链路(逐行核实):

1. webview 每次输入经 vditor `options.input` 回调发出 `save`([index.js:199-202](../../../resource/markdown/index.js#L199-L202))。注意 emit 时机不止 600ms 防抖([afterRenderEvent.ts:29-37](../../../vditor/src/ts/wysiwyg/afterRenderEvent.ts#L29-L37),`undoDelay` 默认 600ms 见 [Options.ts:79](../../../vditor/src/ts/util/Options.ts#L79)):命中「行首空格 / heading 标记 / 分隔线标记」等输入时会**同步、不防抖**地 `fireContentInput`([wysiwyg/index.ts:354-357](../../../vditor/src/ts/wysiwyg/index.ts#L354-L357)),即快速输入 markdown 语法字符(`#`、`-`、行首空格)时 `save` 可逐键到达;
2. 宿主 `on("save")` → `scheduleDocumentSync`(400ms 防抖,[markdownEditorProvider.ts:195-205](../../../src/provider/markdownEditorProvider.ts#L195-L205))→ `flushDocumentSync` → `updateTextDocument` 整文档 `applyEdit`([markdownEditorProvider.ts:561-569](../../../src/provider/markdownEditorProvider.ts#L561-L569));
3. `applyEdit` 触发 [handler.ts:43-47](../../../src/common/handler.ts#L43-L47) 注册的 `vscode.workspace.onDidChangeTextDocument` → 发出 `externalUpdate` 事件回到宿主自身;
4. 宿主 `on("externalUpdate")`([markdownEditorProvider.ts:227-233](../../../src/provider/markdownEditorProvider.ts#L227-L233))的两道防线对打字链路均无效:
   - `if (lastManualSaveTime && Date.now() - lastManualSaveTime < 800) return;`(L228)——`lastManualSaveTime` **只在 `doSave`(手动 Ctrl+S / 工具栏保存,L312)里赋值**,全文仅 L179 声明、L228/L309 判断、L312 赋值四处;自动 save→applyEdit 的回声完全不被防住(逐行核实结论:任务假设成立,该防抖只对手动保存生效);
   - `if (content == updatedText) return;`(L230)——`content` 会被**窗口期内新到的 save** 立即推进(L196-197)。竞态窗口 = flush 发出 applyEdit 到回声事件回到宿主之间,remote SSH 下即渲染进程↔远程扩展宿主的网络往返(几十~几百毫秒)。窗口内只要有一次 save 到达(步骤 1 的不防抖 emit 使概率大增),比较即变成「新 content vs 旧 document」→ 判不等 → 宿主把**陈旧旧内容** `handler.emit("update", updatedText)` 下发,且 `content = updatedText` 把内存态一并回退(L231-233);
5. webview `handler.on("update")`([index.js:274-285](../../../resource/markdown/index.js#L274-L285))中 `getMarkdownValue() === content` 必然不等(一侧是最新输入、一侧是回声旧文)→ `editor.setValue(content)`;
6. `setValue` → `renderDomByMd` → **`editorElement.innerHTML = html`**([renderDomByMd.ts:26](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts#L26))。滚动容器就是 `pre.vditor-reset`(= `wysiwyg.element`,见 [documentState.ts:165-180](../../../vditor/src/ts/util/documentState.ts#L165-L180) 绑定滚动监听的选择器 `.vditor-wysiwyg .vditor-reset`),整树替换瞬间 scrollHeight 塌缩 → scrollTop 归 0,重渲染完成后无人恢复(update 路径不调用 `restoreDocumentScroll`,该 API 只在初次加载 `after()` 中经 `restoreDocumentSession` 使用)→ **视口跳到文档顶部**;同时光标选区随 DOM 销毁丢失,竞态窗口内的最新按键在视觉上被回滚(后续 save 会把文档自愈,与「偶发、无稳定复现规律」的现象吻合)。

次要/伴随触发源(走同一条 `update`→`setValue` 通道,一并受益于修复):磁盘被外部真实改动时 VS Code 重载 TextDocument → externalUpdate → 同样全量 setValue 跳顶(该场景内容应当更新,但滚动不应丢)。

已排除项:`\r\n` 归一化差异(L229 `replace(/\r/g,'')` 与 `updateTextDocument` 的 `normalized` 对齐,无竞态时 L230 比较可靠,非本 issue 主因);`markdownConfig` 整页 reload 仅语言切换触发;fileChange 事件宿主侧无监听者,不参与该链路。

Ubuntu SSH 环境的解释:applyEdit 回声与 save 消息均需跨网络往返,竞态窗口比本地宽一个数量级,故远程开发最易命中,与 issue 环境描述一致。

## 修复方案

方案 A(宿主,根治回声误判,主修复):

- [markdownEditorProvider.ts](../../../src/provider/markdownEditorProvider.ts) 增加实例级 `lastAppliedText`:在 `updateTextDocument` 内把成功 apply 的 `normalized` 记录下来(`flushDocumentSync`/`doSave` 均经此路径);
- `on("externalUpdate")` 的 L230 比较改为双条件:`if (updatedText === lastAppliedText || content == updatedText) return;`——自家 applyEdit 的回声(即使因竞态显示为陈旧内容)一律吞掉:不回退 `content`、不 emit;真外部修改(updatedText 既非 lastAppliedText 也非 content)仍正常下发。

方案 B(webview,滚动/焦点保持,纵深防御,对外部真实修改场景也生效):

- [index.js](../../../resource/markdown/index.js) 的 `update` handler 在 `editor.setValue(content)` 前保存 `editorElement.scrollTop`(及近似光标位置),setValue 后恢复;或为 vditor `setValue` 增加 `keepScroll` 选项,在 [renderDomByMd.ts:26](../../../vditor/src/ts/wysiwyg/renderDomByMd.ts#L26) 替换 innerHTML 前后保存/恢复 `editorElement.scrollTop`。

可选加固(非必需,方案 A 已足够精确):对打字触发的自同步也记录时间戳(类似 `lastManualSaveTime`)做短窗抑制——时间窗方案在极高延迟下仍有缝隙,故只作备选。

## 验证方式

对应「复现步骤」逐条:

1-3. 打开复现文件,滚动到中下部连续快速输入 10 秒以上,并刻意覆盖三类高频触发源:纯英文、中英混输、**markdown 标记字符**(`#`/`-`/行首空格,对应 [wysiwyg/index.ts:354-357](../../../vditor/src/ts/wysiwyg/index.ts#L354-L357) 的不防抖 emit):预期视口始终跟随光标,不再跳顶,且不丢字符(修复前竞态命中时最后几笔输入会被视觉回滚);
4. 观察跳变时机:修复后「跳变与自动保存/语法刷新同步」的现象应完全消失;
5. Ctrl+S 手动保存后立即继续快速输入(跨越 800ms 防抖窗口内外):预期同样稳定。

回归项:

- 外部真实修改:编辑器打开状态下用 VS Code 默认编辑器或外部程序修改磁盘文件,内容仍同步进编辑器(方案 A 放行),且滚动位置保持(方案 B 生效);
- 手动保存链路(doSave → `workbench.action.files.save`)、导出 PDF/Docx/HTML、查找(FindBar)、大纲点击跳转滚动、粘贴图片、语言切换整页重载行为不变;
- 状态栏字数统计在输入过程中正常刷新。

## 核查记录

- 2026-10-08 按「复现步骤」实测:打开复现文件,滚动至中下部连续快速输入(覆盖纯英文/
  中英混输/`#`、`-`、行首空格等 markdown 标记字符)10 秒以上,当前版本(4.2.2)
  **无法复现视口跳顶**,输入过程视口稳定跟随光标 → 无需代码修复,归档。
- 根因定位的「陈旧回声竞态」分析与方案 A/B(lastAppliedText 双条件 / setValue 滚动保持)
  保留备查:若后续版本或远程 SSH 高延迟环境再现同类跳顶,可直接按方案 A 实施。
