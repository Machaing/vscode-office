# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/497](https://github.com/cweijan/vscode-office/issues/497)

## 标题

[BUG]跨页面的表格会显示不完整

## 标签

bug

## 问题描述

提交者 Kuluma,2026-06-29。环境(OS / Extension Version)均未填写。

正文仅一张截图(截图内容无法从 issue 页面提取),无文字描述、无复现步骤;按标题,截图展示的应为表格在分页边界处内容被截断/显示不完整的现象。

归属判断(推断):截图与上传文件均不可得,正文未说明格式;「跨页面」的分页特征与 Word 查看器(分页渲染 docx)匹配,而 markdown/html 预览无分页概念,故按 word 归类生成复现文件。若后续确认为其他格式,再补对应复现数据。

截至抓取时无任何评论,无维护者回复。

## 期望行为

跨页表格完整渲染:分页处自动续行、行内容不被截断,表头按设置重复显示(推断,正文未明写)。

## 实际行为

跨页面的表格显示不完整(标题与截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/word/test-word-cweijan-497-cross-page-table.docx`
生成脚本: `test-workspace/_generate/issue_497_cross_page_table.py`

文件内容说明: 1 个 100 行 × 4 列的长表格(Table Grid 样式),首行设置 `w:tblHeader` 跨页重复表头,每第 15 行设置较大行高使行边界与分页边界交错;表格前后各有正文段落,便于对比跨页前后内容是否正常渲染。Word/WPS 中该表格跨约 3 页。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 滚动浏览表格跨越分页的区域,并与 Word/WPS 打开同一文件的效果对比;
3. 预期: 表格各行完整显示、跨页处正常续行、重复表头生效;实际: 跨页处表格行丢失或内容截断显示不完整。

## 根因定位

**docx-editor 的 Word 分页是逻辑分页, 不是 CSS 分页**: `@eigenpal/docx-editor-core` 的 layout 管线(`layoutDocument` → `layoutTable`,dist 中 `chunk-L7HQCG64.mjs` / `chunk-LNHPDJCA.js` 的压缩函数 `Kt`)先离线测量各块/各行高度, 把表格按行区间切成 fragment 分配到各页; React 侧 `paged-editor` 渲染分页层(`.layout-page` / `.layout-table`, 普通可视区虚拟化), 隐藏的 ProseMirror(`.paged-editor__hidden-pm`)只是编辑数据源, 与分页展示无关。

**表格跨页的切行行为在 `Kt(layoutTable)`**: 逐行累高, 当某行放不下当前页剩余空间且该行未设 `w:cantSplit` 时, 调用 `Ee()` 在**行内**找一个拆分点(候选点 = 各单元格内容的段落底线 flatBottoms), 把行从中间切开——上半段留在本页底部(`bottomClip`), 下半段作为 `topClip` 续行放进下页 fragment 顶部, 渲染层用 `.layout-table-cut-border` 画出切线并靠容器裁剪。

**复现文件实测**(1.9.0 未修复版, 无头渲染, 100 行表共 11 页):

- 全部 100 行文字其实在 DOM 中都存在(两页拼起来不缺字), **丢的不是数据而是"行的完整性"**;
- 从第 2/3 页边界起共 7 处(行 30/40/50/60/70/80/90)被从行中间切开: 本页底部只显示该行"说明"列的第 1 行文字(约 21px, 其余 ~58px 被裁掉), 下页顶部重复表头之下的续行**序号/名称单元格为空**(这两列的单行内容整体留在了上一页), 说明列只剩后半段文字——页边界两侧各呈现"半行", 即用户截图所示的"跨页表格显示不完整";
- 切线虽对齐到行内段落底线, 但切边 border 与裁剪线有 1~2px 重叠, 文字底部紧贴切线, 进一步强化"文字被拦腰截断"的观感(视觉复核确认);
- 该"允许行内拆分"策略不符合本 issue 期望的 Word 惯例呈现(跨页处行完整、整行顺延到下页)。

另: `w:cantSplit` 行在"作为分片首行且整页都放不下"时会被整体强排并溢出页底(超出部分永久不可见), 属另一极端分支, 修复前后行为一致, 本次未改动。

## 修复方案

分页决策在 core 内部, 样式/仓库侧无法干预 → 走 pnpm patch, 在 [patches/@eigenpal__docx-editor-core.patch](../../patches/@eigenpal__docx-editor-core.patch) 上**追加**(与 597 域修复共存, 两者改动的 chunk 文件不相交)。

修改 `Kt` 的行拆分决策一行(ESM/CJS 两份同步改):

- 原: `x=e.rows[T]?.cantSplit?0:Ee(s,T,v,p)` —— 只要行内存在可拆分点就在页边界把行切开;
- 改: `x=w>P?0:e.rows[T]?.cantSplit?0:Ee(s,T,v,p)` —— 本页分片已放过至少一行(`w>P`, 即该行不是分片首行)时**不再拆行**, 整行顺延到下一页(fragment 循环末尾的 `ensureFits(重复表头+整行高)` 已保证下页放得下); 仅当行是分片首行(`w===P`, 即行高超过整页可用高度, 不拆必然丢内容)才保留 `Ee` 行内拆分; `cantSplit` 语义不变。

行为对照 Word: Word 表格属性默认勾选"允许跨页断行"时同样会切行, 但用户普遍以"整行顺延"为完整显示预期, 故本修复采取不切行策略(与 issue 标题期望一致)。

应用脚本: `test-workspace/_generate/apply_497_patch.py`(参照 `apply_597_patch.py` 套路; 若重建 pnpm patch 目录, 需先跑 `apply_597_patch.py` 再跑本脚本, 最后 `pnpm patch-commit node_modules/.pnpm_patches/@eigenpal/docx-editor-core@1.9.0`)。

## 修复记录

2026-09-15 已实施本地补丁并通过无头验证(`test-workspace/_generate/render497/`):

- **修前**(截图 `render497/render-497-before.png`): 10 个表格分片 `(0,10)(10,20)(20,31)(30,41)(40,51)…(90,101)`, 行 30/40/50/60/70/80/90 各出现在相邻两个分片(被切), 8 个分片带 cut border; 页 4 底部行 40 仅显示首行说明文字, 页 5 顶部续行序号/名称为空;
- **修后**(截图 `render497/render-497-fixed.png`): 11 个分片 `(0,10)(10,20)(20,30)…(100,101)` 严格按整行边界, `splitRows=[]`、`missingRows=[]`、cut border 0; 页 4 底部行 39 完整收尾(带底边框), 页 5 顶部重复表头下行 40 完整(序号 + 三行说明文字齐全); 100 行全部可见, 无行丢失、无跨片重叠, 总页数仍 11;
- **回归**: `issue-597-toc.docx`(hyperlink 版, 5 条目 + 链接)、`issue-597-toc-plain.docx`(5 条目)、`test-word-cweijan-529-toc-blank.docx`(6 条目 + 页码)、`test-word-cweijan-311-tif-image.docx`(`?convert=1`, 可见分页层两张图均 `data:image/png` 320×320 正常解码)、`sample.docx`(段落/列表/3×3 表格/引用完整)均无回归;
- `npm run build` 生产构建通过, `out/webview/assets/Word-*.js` 含修复后逻辑(压缩为 `y>m||e.rows[_]?.cantSplit?0:mD(…)`, 语义等价)。

上游发布修复版本后, 随 597 补丁一并移除并升级依赖(见 [plan-dependency-upgrade.md](plan-dependency-upgrade.md))。

## 验证方式

```bash
# 1. 生成复现文件(已有则跳过)
python test-workspace/_generate/issue_497_cross_page_table.py

# 2. 构建无头验证 bundle(仓库根目录)
npx esbuild test-workspace/_generate/render497/main.jsx --bundle --format=iife \
  --outfile=test-workspace/_generate/render497/bundle.js --jsx=automatic \
  --platform=browser --define:process.env.NODE_ENV='"production"'

# 3. 以 test-workspace 为根起静态服务
cd test-workspace && python -m http.server 8791 --bind 127.0.0.1

# 4. 浏览器打开(渲染完成后 title=RENDER_DONE, 结果在 window.__RESULT__;
#    harness 会滚动遍历虚拟化分页并聚合所有表格分片):
#    http://127.0.0.1:8791/_generate/render497/index.html?file=word/test-word-cweijan-497-cross-page-table.docx
#    判定: splitRows 与 missingRows 均为 [], fragmentsWithCut=0,
#          fragments 形如 0-10,10-20,…,100-101(整行边界, 无跨片重叠)。
#    回归: ?file=word/issue-597-toc.docx 、?file=word/issue-597-toc-plain.docx
#          (render529 harness)、render311 harness(?convert=1)、?file=word/sample.docx
```
