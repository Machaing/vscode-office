# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/599](https://github.com/cweijan/vscode-office/issues/599)

## 标题

[BUG] Search in VS code action bar does not jump to text in markdown file

## 标签

bug

## 问题描述

环境:macOS Tahoe 26.6.2,扩展版本 4.2.0(2026-09-05 提交)。

使用 VS Code 侧边栏(action bar)的全局搜索时,点击搜索结果虽然打开了对应的 markdown 文件,但不会跳转到文件内匹配文本的位置,而是停在文件顶部。原话:

> clicking on the results opens the file but does not jump to the text in the file. Instead it opens at the top of the file.

随后切换到 markdown 文本编辑器(铅笔图标,即切换回默认文本编辑器)后,光标同样位于文件顶部,未随搜索结果定位。

正文附一张截图展示搜索结果与文件停在顶部的现象,未提供其他复现细节。

## 期望行为

(推断)点击搜索结果后,文件打开时应定位并滚动到匹配文本所在行,与 VS Code 原生文本编辑器的搜索跳转行为一致。

## 实际行为

文件在扩展的 Markdown 查看器中打开后停在文件顶部,不跳转到匹配位置;再切换到文本编辑器后光标也停留在文件顶部。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-599-search-result-jump.md`
生成脚本: 文本文件,直接维护

文件内容说明: 较长的 Markdown 文档(60 行填充内容),唯一关键词 `SEARCHJUMPTARGET` 位于文件靠后位置(约 80% 处),使「停在文件顶部」与「跳转到匹配行」的差别足够明显。

### 复现步骤

1. F5 调起扩展调试(开发扩展宿主的工作区需包含 `test-workspace`);
2. Ctrl+Shift+F 打开全局搜索,搜索 `SEARCHJUMPTARGET`;
3. 点击搜索结果中复现文件对应的条目,文件以扩展的 Markdown 查看器打开;
4. 预期: 视口/光标跳转到 `SEARCHJUMPTARGET` 所在行;实际: 文件打开在顶部,与 issue 现象一致;
5. 继续验证 issue 的第二段现象:点击编辑器右上角铅笔图标切换到文本编辑器,观察光标是否仍停留在文件顶部。

## 根因定位

链路现状(已逐层查证):

1. **编辑器形态**:vscode-office 的 markdown 编辑器是 `CustomTextEditorProvider`(webview)。`src/provider/markdownEditorProvider.ts` 实现该接口,`package.json` 的 `customEditors` 中 `maizhuoying.markdownViewer` 未声明 `priority`(缺省即 default),接管 `*.md`。
2. **搜索能命中**:workbench 全局搜索基于磁盘文本模型,与编辑器类型无关,所以「搜得到」不是问题。
3. **不跳转的机制**(VS Code 内核行为,与平台无关):
   - 搜索结果点击走 `searchView.open()` → `editorService.openEditor({resource, options:{selection,...}})`;
   - 当资源解析为 webview 自定义编辑器时,`CustomEditorInput` 对 `ITextEditorOptions`/`selection` 无任何处理——**匹配位置被内核静默丢弃**;searchView 侧只对 `isCodeEditor` 的控件做范围高亮,对其他控件直接 `removeHighlightRange`,不创建文本编辑器、不触发任何事件;
   - 扩展侧无 API 可获知匹配位置:`resolveCustomTextEditor(document, webviewPanel, token)` 没有 options 参数;`WebviewPanel.options`(含 `enableFindWidget`)是 readonly,自定义编辑器面板由内核创建、无法启用;自定义编辑器激活时 `window.activeTextEditor` 为 undefined;没有暴露搜索查询词/结果的任何事件。
   - 上游追踪:[microsoft/vscode#289785](https://github.com/microsoft/vscode/issues/289785)(2026-01 提出「Search result navigation does not provide target selection」,open、无 milestone);[microsoft/vscode-discussions#2621](https://github.com/microsoft/vscode-discussions/discussions/2621)(2025-03 同类提问,社区结论「没有任何事件在点击搜索结果时触发」,Unanswered)。
4. **issue 第二段现象同根因**:切换到文本编辑器后光标停在顶部,是因为 selection 在最初打开时已被丢弃,「Reopen Editor With…」不携带任何定位信息。

**结论**:在 VS Code 内核补上「把 selection 传给自定义编辑器」的 API 之前,「点击搜索结果 → webview 直接跳到匹配处」无法实现;本仓库能做的是提供等价的替代定位入口并保留可复用的宿主→webview 定位链路。

## 修复方案

缓解性修复(最小改动,不动 vditor/ 子项目):

1. **宿主新增命令 `office.markdown.find`**(命令面板「Find text in markdown editor」):
   - `src/service/markdown/blockScroll.ts` 新增活跃 webview 跟踪(`setActiveMarkdownWebview`/`clearActiveMarkdownWebview`/`getActiveMarkdownWebview`):`onDidChangeViewState` 可见时刷新、`onDidDispose` 清理;
   - `src/provider/markdownEditorProvider.ts` 的 `promptFindText`:`showInputBox`(i18n `ext.markdown.findPrompt`)→ `handler.emit('revealSearchTerm', keyword)`;接收 webview 回传 `revealSearchTermResult`,未命中弹 `ext.markdown.findNotFound` 警告;无活跃编辑器弹 `ext.markdown.findNoActiveEditor`;
   - `src/extension.ts` 注册命令;`package.json` 增加 commands 项;3 个 i18n key 补齐全部 10 个 `package.nls.*.json`。
2. **webview 处理 `revealSearchTerm`**(`resource/markdown/index.js`):
   - **优先路径**:点击工具栏 find 按钮懒实例化本 fork 既有 vditor FindBar(`vditor/src/ts/toolbar/Find.ts` + `ui/FindBar.ts`,850 行完整查找/替换组件,webview 内 Ctrl+F 就是它),预填关键词并派发 `input` 事件触发其搜索——高亮全部匹配(CSS Custom Highlight API)、滚动到首个匹配、显示计数、Enter/上下按钮翻页与替换全部复用;
   - **回退路径**(FindBar 不可用,如工具栏被隐藏):`revealSearchText` 用 TreeWalker 在当前编辑面(wysiwyg/ir)找首个匹配文本节点,滚动所在块到视口中央并以 `.vditor-search-flash` 闪烁高亮(`resource/markdown/index.css` 新增样式,VS Code findMatch 主题色);非 CodeMirror 内容同步设置 DOM 选区;
   - 命中判定读取 FindBar 计数元素:`"1 / N"` 为命中、`No results` 未命中、空文本不误报(CM 懒加载场景),120ms 延迟回传结果。
3. **明确不做**:不拦截 webview 的 Ctrl+F——Find.ts 已在 document 上绑定 Ctrl+F/Ctrl+R,重复绑定会同时弹出两套查找 UI(开发中曾误加后移除);不改 `vditor/` 目录与 `patches/`(避免与并行 issue 工作冲突)。
4. **复现文件修正**:原第 5 行说明文字本身含关键词,破坏「唯一关键词」前提,已改为仅第 60 行出现。

内核 API 落地后(microsoft/vscode#289785)的接线点:`resolveCustomTextEditor` 拿到 selection 时直接走同一条 `revealSearchTerm` 链路即可,无需再改 webview。

## 修复记录

- 日期: 2026-09-15
- 修改文件:
  - `src/service/markdown/blockScroll.ts`:新增活跃 markdown webview 跟踪(activeHandler + set/clear/get);
  - `src/provider/markdownEditorProvider.ts`:新增 `promptFindText`/`findInActiveEditor`,注册 `revealSearchTermResult` 处理(未命中警告),可见/销毁时维护活跃 webview;
  - `src/extension.ts`:注册 `office.markdown.find`;
  - `package.json`:commands 增加 `office.markdown.find`;
  - `package.nls.json` 等 10 个语言文件:新增 `ext.markdown.findPrompt` / `ext.markdown.findNotFound` / `ext.markdown.findNoActiveEditor`;
  - `resource/markdown/index.js`:新增 `openFindBarWithKeyword`(预填打开 FindBar)、`findBarHasResult`(计数判定)、`revealSearchText`(TreeWalker 回退定位)、`flashSearchMatch`,并注册 `revealSearchTerm` 消息处理与结果回传;
  - `resource/markdown/index.css`:新增 `.vditor-search-flash` 闪烁高亮样式;
  - `test-workspace/markdown/test-markdown-cweijan-599-search-result-jump.md`:关键词改为仅出现一次。
- 未改动:vditor/ 子项目、patches/、src/react、issues.xlsx、ISSUES.md。

## 验证方式

### 已完成验证(2026-09-15)

1. **消息链路一致性**(grep 核对):宿主 `emit('revealSearchTerm')` ↔ webview `handler.on("revealSearchTerm")`;webview `emit('revealSearchTermResult')` ↔ 宿主 `.on("revealSearchTermResult")`;命令 `office.markdown.find` ↔ `findInActiveEditor()` ↔ `getActiveMarkdownWebview()`。
2. **静态检查**:`tsc --noEmit` 所改宿主文件无错误(仓库其他文件既有报错与本次无关);`eslint` 通过;`node --check` 校验 index.js/util.js 语法通过;package.json 与全部 nls JSON 解析通过。
3. **浏览器实测**(临时静态服务托管 `resource/`,stub `acquireVsCodeApi` 模拟宿主 init→open 握手,加载复现文件):
   - `revealSearchTerm('SEARCHJUMPTARGET')` → FindBar 显示、输入框预填、计数 `1 / 1`、CSS highlight(`vditor-find-match`/`vditor-find-current`)注册、滚动容器 `.vditor-reset` scrollTop 0→755 滚到匹配处、回传 `{found:true}`;
   - `revealSearchTerm('ZZZ_NO_SUCH_TEXT_599')` → 计数 `No results`、回传 `{found:false}`(宿主侧将弹警告);
   - 移除工具栏 find 按钮强制回退路径 → `.vditor-search-flash` 高亮出现、DOM 选区选中关键词、滚动居中(0→1064)、回传 `{found:true}`;
   - 回归:FindBar 关闭后向 body 派发 Ctrl+F 仍能重新打开(vditor 自有 document 级绑定不受影响),关闭按钮正常;
   - 现象复现确认:点击搜索结果后停在顶部为内核行为(见根因),扩展层无法改变。
   - 测试用临时脚本(`test-workspace/tmp-599-mdfind/`)验证后已删除。

### 手动验证步骤(VS Code 内,待 F5 执行)

1. F5 开发扩展宿主(工作区含 `test-workspace`),打开 `markdown/test-markdown-cweijan-599-search-result-jump.md`;
2. Ctrl+Shift+F 搜 `SEARCHJUMPTARGET`,点击结果:确认现状——文件在 Markdown 查看器打开且停在顶部(内核缺口,预期保留);
3. webview 聚焦后 Ctrl+F:vditor FindBar 打开,输入关键词可定位(既有功能,确认本次改动无回归);
4. Ctrl+Shift+P → 「Find text in markdown editor」→ 输入 `SEARCHJUMPTARGET` 回车:FindBar 自动打开、预填、高亮并跳到匹配行,状态栏计数 1/1;
5. 同命令输入不存在词:右下角出现「未找到匹配」警告;
6. 关闭所有 markdown 编辑器后执行命令:提示无激活的 Markdown 编辑器;
7. 回归:Ctrl+S 保存、Ctrl+V 粘贴、铅笔切换编辑器、主题切换不受影响。

### 局限

- 侧边栏搜索点击后的**自动**跳转在本版本无法实现(依赖上游 microsoft/vscode#289785 落地);需要原生搜索跳转体验的用户可按 `docs/faq/markdown-default-editor-CN.md` 将 `*.md` 默认编辑器切回文本编辑器;
- 命令入口定位到首个匹配(FindBar 打开后可用 Enter/上下按钮继续翻页);FindBar 计数在 CodeMirror 懒加载极端场景下可能晚于结果回传稳定,此时按「命中」处理以避免误报。
