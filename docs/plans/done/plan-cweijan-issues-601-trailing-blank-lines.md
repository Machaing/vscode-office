# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/601](https://github.com/cweijan/vscode-office/issues/601)

## 标题

[BUG] 切换窗口后再切回来,页面结尾的多个空行被删除

## 标签

bug

## 问题描述

环境:Win10,扩展版本 4.2.0(2026-09-06 提交)。

用户在 md 文件底部输入了 N 个换行(结尾多个空行),目的是让当前编辑行显示在屏幕相对中间的位置。切换到其他窗口后再切回来,结尾多余的空行被全部 trim 掉。原话:

> 我在md文件底部输入了N个换行,为了让当前行能在屏幕相对中间的位置。但是切换窗口后再回来,多余的空行全部被trim掉了

## 期望行为

文件结尾的空行应原样保留;切换窗口返回后,编辑器内容不应被自动改写。

## 实际行为

切换窗口再切回后,文件结尾的多个空行被自动 trim 删除。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-601-trailing-blank-lines.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 Markdown 载体,标题 + 一段说明 + 一行正文;文件在最后一行内容之后**真实保留了 6 个连续空行**(文件字节以 7 个 LF 结尾,即内容行结束符 + 6 个空行),对应 issue 中"底部输入 N 个换行"的初始状态。注意维护该文件时不要让编辑器自动去除尾部空行。

### 复现步骤

1. F5 调起扩展调试,打开复现文件,确认结尾显示多个空行(可在状态栏看到行数,或切到文本编辑器核对);
2. 将光标放在「这是最后一行内容。」上,滚动让当前行处于屏幕相对中间位置(复现 issue 的使用动机);
3. Alt+Tab 切换到其他应用窗口,再切回 VS Code(触发 webview 隐藏/重新可见与内容同步);
4. 预期: 结尾空行原样保留;实际: 多余空行被 trim 删除,与 issue 现象一致;
5. 核对磁盘文件是否被同步改写:关闭该标签页后用文本编辑器重新打开,或在仓库根执行 `git diff -- test-workspace/markdown/test-markdown-cweijan-601-trailing-blank-lines.md` 查看是否出现删除尾部空行的改动。

## 根因定位

结论(2026-09-15,已用 Node 直连 Lute 字节级验证):空行丢失点不在宿主保存链路,而在 **Lute 的 md↔DOM 双向序列化均不表达"文件尾部空行"**,污染在用户敲入空行的瞬间即发生,切换窗口只是让被污染的内容重新渲染到页面上。

字节级证据(直接调用 `vditor/src/js/lute/lute.min.js`):

| 调用 | 输入 | 输出 |
| --- | --- | --- |
| `Md2VditorDOM("# Title\n\n正文。\n\n\n\n\n\n\n")` | 结尾 7 个 LF | `<h1…>…</h1><p…>正文。</p>`(结尾空行全丢) |
| `VditorDOM2Md("<p>line</p>" + 6 个空 <p>)` | 6 个空段落 | `"line\n"`(结尾空段落折叠为单个 `\n`) |
| IR 的 `Md2VditorIRDOM` / `VditorIRDOM2Md` | 同上 | 同样丢失/折叠 |

触发链(代码级推演,宿主侧 `markdownEditorProvider.ts` + webview 侧 `resource/markdown/index.js`):

1. 用户在底部连敲 N 个 Enter → 浏览器/vditor 在 DOM 末尾创建 N 个空 `<p>`(页面显示空行,此时视觉正常);
2. 每次 input → `getMarkdown()` → `VditorDOM2Md` 把结尾空段落折叠成单个 `\n` → webview `input(content)` → `handler.emit("save", …)`;
3. 宿主 `scheduleDocumentSync` 立即 `content = newContent`(**此刻宿主缓存的 content 已被 trim 污染**),400ms 后 `updateTextDocument` 用 WorkspaceEdit 把去掉空行的文本写回 TextDocument(文件变 dirty;开启 autoSave 时会直接落盘丢失);
4. 切换窗口再回来:webview 内部对 blur/focus 只做光标与滚动恢复(`saveCacheFocus`/`restoreCacheFocus`),不主动改内容;页面空行消失的载体是任何一次以宿主 `content` 为源的重新渲染——webview 重新 init(`open` 消息携带被污染的 `content`,Reload Window/webview 回收后重载均会触发)或 `externalUpdate` 不一致时推送 `update` → `editor.setValue()` → `renderDomByMd`。两条路径都以上述被污染的序列化文本为源,DOM 因此被重建成无空行版本;
5. 磁盘侧:dirty 的 TextDocument 在用户保存(或 autoSave: onWindowChange/afterDelay——同样以"切窗"为触发点)时把 trimmed 内容写入磁盘。

即:切换窗口本身不改内容,它只是让"第 2 步就已丢掉空行的内容"重新上屏/落盘的常见契机。

## 修复方案

修复层选择:**vditor 子项目(fork)双向保真**,宿主(`markdownEditorProvider.ts`)无需改动——宿主的 save/doSave/externalUpdate 链路本身不 trim,污染源是 webview 传回的序列化文本。

核心思路:文件尾部的 T 个连续 LF 语义为"T-1 个空行",与 DOM 末尾的空段落一一对应,在 Lute 两侧各补一层:

1. **新增 `vditor/src/ts/util/trailingBlankLines.ts`**:
   - `appendTrailingBlankParagraphs(element, md)`:渲染方向,按 md 结尾 LF 数在编辑器末尾补 `T-1` 个 `<p data-block="0">​</p>`(ZWSP 空段落,与 vditor 既有空段落约定一致);
   - `withTrailingNewlinesFromDom(md, element)`:序列化方向,Lute 输出恒以单个 `\n` 结尾,再按 DOM 结尾空段落计数补齐其余 `\n`;
   - `countTrailingBlankParagraphs`:只统计顶层结尾的空 `<p>`(仅 ZWSP/空白文本、子元素仅 br/wbr),跳过 `vditor-editor-boundary` 哨兵 span;
   - `BOUNDARY_SENTINEL_CLASS` 常量移入本文件,`renderDomByMd.ts` 改为 import 并 re-export(避免与 getMarkdown 的循环依赖)。
2. **渲染方向接线**(3 处全量渲染入口):`renderDomByMd.ts`(wysiwyg:setValue/初始化/切模式,在 `ensureEditorBoundaryParagraphs` 前调用)、`EditMode.ts` IR 分支(切模式)、`src/index.ts` IR `setValue`。
3. **序列化方向接线**:`markdown/getMarkdown.ts` 在 Lute 序列化后按 DOM 补 `\n`。`getMarkdown` 是唯一出内容口(getValue/input/blur/esc/recordHistory→fireContentInput 全部经它),修一处即覆盖 input→save→宿主同步→落盘全链。

语义与边界:

- `line\n`(正常文件单个结尾换行)→ 0 个空段落,序列化仍为 `line\n`,与旧行为完全一致;
- 用户编辑的空行=真实 DOM 空段落,序列化如实还原(编辑器语义下尾部空行保留是 markdown 惯例);
- 段落之间的多重空行(interior blank lines)仍按 CommonMark 归一,为 Lute 既有行为,不在本 issue 范围;
- 空段落计数仅认顶层 `<p>`,代码块/表格/标题等结尾块不受影响。

产物:`vditor/dist` 与 `resource/markdown/dist`(gitignore 内的派生产物)已随 vite 重新构建。

## 修复记录

- 2026-09-15:按上述方案实现。改动文件:
  - `vditor/src/ts/util/trailingBlankLines.ts`(新增):`appendTrailingBlankParagraphs` / `withTrailingNewlinesFromDom` / `countTrailingBlankParagraphs` / `countTrailingNewlines`,`BOUNDARY_SENTINEL_CLASS` 移入;
  - `vditor/src/ts/wysiwyg/renderDomByMd.ts`:wysiwyg 渲染接线 + 哨兵常量改为 import/re-export;
  - `vditor/src/ts/toolbar/EditMode.ts`:IR 切模式渲染接线;
  - `vditor/src/index.ts`:IR `setValue` 渲染接线;
  - `vditor/src/ts/markdown/getMarkdown.ts`:序列化方向按 DOM 结尾空段落补齐结尾 `\n`。
- 宿主侧 `src/provider/markdownEditorProvider.ts` 无改动(其 save/doSave/externalUpdate 链路本身无 trim,污染源在 webview 序列化文本)。
- `resource/markdown/dist`、`vditor/dist` 为 gitignore 派生产物,已用 `vite build --mode production` 重建。

## 验证方式

无头层(Node 22 + jsdom + 真实 `lute.min.js` + esbuild 编译的真实 `trailingBlankLines.ts`,临时脚本已用后清理):

1. **round-trip 保真(21 项全过)**:复现文件(7 个 LF)wysiwyg/IR 渲染出 6 个空段落,序列化回 7 个 LF 字节级一致;模拟"切窗回来 webview 重载"二次渲染后仍 6 个空段落、二次序列化稳定;模拟再敲 3 个 Enter 后 10 个 LF;正常单 LF 文件、无结尾换行文件、代码块/标题结尾+空行、`<br>` 空段落、IR 模式全部覆盖;interior 空行归一行为与修复前一致(回归确认)。
2. **宿主触发链模拟(PASS)**:按 `markdownEditorProvider.ts` 原逻辑搭 fake TextDocument + 同步函数——打开(7 LF→6 空段落)→ 敲 3 个 Enter("save" 去抖落 TextDocument,10 LF)→ `externalUpdate` 守卫 `content == updatedText` 成立、不向 webview 推 update(即不触发 setValue,DOM 空段落原样保留)→ 即便 webview 整体重载,`open` 重建 9 个空段落且 `getMarkdownValue() === content` → doSave 落盘 10 LF。
3. **语料库回归(24 个 test-workspace md 文件,全过)**:每个文件修复前后 round-trip 输出剥掉结尾 `\n` 后逐字节一致,即本修复对"尾部仅 1 个 LF"的全部既有文件零影响;差异仅出现在 issue-601 复现文件(7 LF→7 LF,修复前为 7→1)。
4. 交互层建议:F5 打开复现文件,底部敲 N 个 Enter,Alt+Tab 切走再切回,确认空行保留;`git diff -- test-workspace/markdown/test-markdown-cweijan-601-trailing-blank-lines.md` 无改动;Ctrl+S 后用文本编辑器复核磁盘结尾仍为 7(或更多)个 LF。
