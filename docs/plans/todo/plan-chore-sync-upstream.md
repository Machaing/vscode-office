# 上游同步:对比 upstream 差异并制定选择性合并方案

> 创建: 2026-11-20 · 性质: 任务型方案(非 bug 修复),数据基于当日 `git fetch upstream` 实测

## 背景与目标

本仓库 fork 自 `cweijan/vscode-office`,既定策略是 upstream 只读参考、分支保持区分不整体 merge。
本文档盘点 fork 后 upstream 的全部更新,逐项评估与现有功能的冲突及合并价值,给出可执行的选择性吸收方案。
上游更新内容以提交与 changelog 为准逐条核对过,不是按 changelog 转述。

## 分叉概况(2026-11-20 fetch 后)

| 项 | 数据 |
| --- | --- |
| 分叉点(merge-base) | `908258d`(2026-10-10 前) |
| upstream/main 领先 | 28 个提交,对应上游 4.2.1、4.2.2 两个版本(2026-10-13 ~ 10-15) |
| upstream/dev 额外领先 | 4 个提交,对应上游 4.2.3(2026-10-26) |
| 本仓库领先 upstream/main | 83 个提交(29+ 个上游 issue 修复、官方 NLS 接入、CI 发版、改名 Office Viewer Enhance、文档与 test-workspace 体系) |
| 双边都改过的文件 | 32 个(含 package.json 与全部 11 个 nls 文件,重灾区见下节) |

**版本号已撞车**:上游 4.2.3(10-26) 与本仓库 4.2.3(`d7c60dd`) 同号不同内容。版本号如何与上游区分见下文[「版本号区分策略」](#版本号区分策略)一节。

## upstream 更新清单与逐项评估

术语说明:

- **cherry-pick(摘取提交)**: 把单个提交的改动复制到当前分支的操作
- **NLS**: VS Code 官方的扩展本地化机制,本仓库已接入 package.json 的命令与配置描述翻译
- **Pro**: 上游的付费功能体系;本仓库另有自己的收费设计 [plan-feat-pro-charge.md](plan-feat-pro-charge.md),两者不互通

### P1 建议吸收,冲突面小

| 提交 | 内容 | 冲突面评估 |
| --- | --- | --- |
| `46cbde1` | fix(excel): 缩放后选框错位 | sheet.js 3 行小改,本地未改过该文件 |
| `b271e89` | fix(markdown): 编辑中意外滚动回顶部 | documentSync.ts 新增 28 行并带测试;本地未改过该文件。**对应 cweijan-570**(当时实测无法复现未处理,吸收后回填 issues.xlsx) |
| `3aad0e6` | fix(git-history): Windows 仓库路径去重(PR #630) | repoDiscovery.ts / repoPath.ts 本地均未改过 |
| `69a6932` | fix(compress): zip 查看默认编码改 utf8 | zipHandler.ts / zipArchive.ts 本地均未改过 |
| `59f51f5` | feat(excel): 适配平滑滚动 | sheet.js 121 行重构 + index.less;本地未改过这两个文件 |
| `e56806c` | fix(markdown): IR 模式外部代码块更新 | vditor/src/index.ts 4 行;该文件本地有改动,手工合入即可 |
| `bfc130b` | fix(markdown): 不再把 `/` 开头路径当工作区路径解析 | webviewUri.ts 本地未改;markdownEditorProvider.ts 仅 2 行 |
| `32c2a53` | feat(pdf): 切换高对比色时自动换亮/暗主题 | resource/pdf/main.js 16 行;该文件本地 593 修复动过,手工合入 |
| `9949595` | feat(table): 表格快速删除按钮 | tableHandle.ts + `_tableHandle.less` 本地均未改;无新文案 |

### P2 建议吸收,需手工合并或适配 i18n

| 提交 | 内容 | 冲突面评估 |
| --- | --- | --- |
| `4e126ae` | feat(excel): 嵌套公式渲染 | cell.js 361 行大重构,与本地 `$` 公式修复(`a97a480`)同文件,必须手工合 |
| `edb7ba2` | feat(csv): 解析带注释的 csv | 新增 csvParser.ts;excel_reader.ts 重构 89 行,与本地 576 兜底、604 求值、239 截断多处改动叠加,必须手工合 |
| `4d8bd39` + `ec4e3fd` | fix(markdown): wikilink 编辑/复制误触发 | 新增 wikilinkBoundary.ts、wikilinkCopy.ts;wysiwyg/index.ts 挂钩点与本地 226 等修复同文件,手工合 |
| `82385f8` | fix(vditor): 可视模式图片路径还原 | imagePath.js + highlightToolbarWYSIWYG.ts,本地未改;需同步 resource/markdown 目录 |
| `c5fffd6` | feat(markdown): 内部文件跳转失败提示 toast | 新增 linkError.js;宿主侧文案是硬编码英文,移植时须接入本仓库 NLS 与 webview i18n |
| `c962435` + `9d46278` | fix(image): 图片模式加载性能、滚轮模式记忆 | Image.tsx 137 行重排 + 新增 browseWheel.ts;Image.tsx 本地有改动,手工合 |
| `18c4768` | refactor(compress): 解压通知从 VS Code 通知移到查看器 UI 内显示 | 新增 ExtractToast.tsx;Zip.tsx / Zip.less 本地有改动,手工合;通知文案须接 i18n |
| `eb7f58a`(dev) | fix(vditor): iframe 不开 HTML 源码编辑器即可交互 | vditor 改动,实施时以 dev 分支为源 |
| `4864643`(dev) | fix(image): 切图时编辑器标题同步 | Image.tsx 冲突区,与图片两件一起做 |

### P3 跳过或不合并

| 项 | 理由 |
| --- | --- |
| `c2b68f7` fix(pdf): PDF 链接跳转 | 本仓库 cweijan-593 已修复且方案更全(含外链走宿主 openExternal) |
| `fbe92ef` fix(markdown): 应用标题丢文本数字 | 疑似与本地 cweijan-590(标题转换丢有序列表序号)同源;实施 P2 时比对两份补丁,确认同一问题则跳过,否则补吸收 |
| 上游「快捷键自定义(Pro)」 | 本仓库已免费实现(cweijan-204/218,含 redo 与 macOS ⌘H 修复),再引入反而冲突 |
| 上游 TTS / AI 功能 | 上游把 TTS 从 Pro 转免费并在往 AI 方向走,与本仓库定位分歧;待 [plan-feat-pro-charge.md](plan-feat-pro-charge.md) 决策,不随本次同步引入 |
| 上游 Live Share 支持(md/csv/docx) | 协作场景使用面窄,暂观察;需要时单独定位提交移植 |
| `605f4c3` 升级 exceljs、`288c0db` 升级 nodejs(dev) | 依赖以本地「核心依赖升级」结果为准,不跟随上游版本动作 |
| changelog.md、package.json、package.nls.* 相关提交 | 结构性分叉:本仓库已改名、接入官方 NLS(9 语言命令名)、独立 CI 与发版,不能直接拿上游版本 |

## 总体结论:是否值得合并

**不做整体 merge,按上表清单选择性吸收。** 理由:

1. 双边 32 个文件改动叠加、83 对 28 的提交分叉,整体 merge 的冲突消解成本高于逐项移植;
2. package.json 与 nls 已结构性分叉(改名、NLS、CI),merge 结果必然破坏本仓库的发布链路;
3. 上游 Pro 化方向(TTS、AI、付费快捷键)与本仓库免费增强的定位冲突,整体带入需要反向拆除;
4. 逐项吸收还能借上游修复回填 issues.xlsx 的 open issue 状态(如 570)。

## 版本号区分策略

术语说明:

- **semver**:语义化版本,格式为主版本.次版本.修订号(如 4.3.0);VS Code 市场只接受三段纯数字,`4.2.3-enhance` 这类后缀写法 vsce 会拒绝
- **扩展 ID**:`发布者.扩展名` 组成的唯一标识。本仓库为 `maizhuoying.vscode-office-enhance`,上游为 cweijan 名下的 `vscode-office`,两者在市场互不相干

先厘清撞号的真实影响面(均已核实):

- **不影响用户装机与升级**:两个扩展 ID 不同,VS Code 各自独立比较版本、独立推送更新,同号互不干扰;
- **不影响 git tag 与 CI**:上游仓库不打 tag,本仓库的 `v*.*.*` tag 触发发版,tag 空间天然独立;继续保持 `git fetch upstream` 不带 `--tags`(默认即如此)即可;
- **真正受影响的是认知与对照**:同一段号两个含义,用户报 issue、对照 changelog、做上游同步 diff 时容易错位。

因此策略目标是「号段可区分、对照可追溯、节奏不被上游绑架」,采用**号段领先 + 基线注记**:

1. **下一版直接发 4.3.0**(原计划 4.2.4),进入本仓库自己的 minor 线。此后按自身变更语义演进:功能与上游吸收算 minor,修复算 patch,大改或 Pro 正式版再进 major;
2. **单一硬约束**:每次发版前查上游最新版本,保证本仓库版本号大于它,避免「Enhance 比上游旧」的观感。上游若发版追平或反超(如上游出 4.3.0),本仓库把 minor 再抬一位(4.4.0),不追赶 patch 对齐;
3. **changelog 注明上游基线**:每个版本条目开头加一行,如「上游基线:cweijan/vscode-office 4.2.3(merge-base `908258d`,选择性吸收)」,同步关系可追溯;4.3.0 条目同时加一句声明,说明既往 4.2.3 与上游同号属两扩展各自版本,本版起号段独立领先;
4. **引用带扩展名**:文档、issue、changelog 中提版本号时写「Enhance 4.3.0」「上游 vscode-office 4.2.3」,不裸写号段。

排除过的备选:

- **追赶对齐**(上游 4.2.3 → 本仓库 4.2.4):patch 段永远粘着上游,发版节奏被绑架,且只差修订号一眼分不清是谁的版本;
- **跳 major(5.0.0)**:无破坏性变更,语义不符,上游迟早进入 5.x 还会再撞;
- **semver 加后缀/预发布号**:vsce 不接受非标准 semver,预发布号在市场走 prerelease 通道,均不可行。

## 合并操作方案

1. 新建分支 `chore/sync-upstream`;
2. 按 P1 → P2 分批移植,每批一个提交组。**不直接 cherry-pick 原提交**(上游提交混有 nls/changelog/版本号改动),改为 `git show <sha> -- <文件>` 取出目标文件的 diff 手工套用;冲突文件以本仓库语义为基准合入上游逻辑;
3. 涉及用户可见文案的(c5fffd6 等),webview 侧接入 `src/react/i18n/messages/` 全部 11 种语言,宿主侧接入 NLS,不得保留硬编码英文;
4. 新增配置项或命令的,在本仓库 package.json 手工补声明与 nls 条目,不从上游文件复制;
5. 每批完成后跑 `npm run lint:fix` 与 `npm run build`,并用 test-workspace 对应格式文件 F5 手测(Excel 打开/保存、Markdown 编辑保存、PDF 链接、zip 解压、图片浏览);
6. P1/P2 全部落地并验证后统一发版,版本号按上节策略定为 4.3.0,发版前核对大于上游当前最新版本;
7. 收尾回填 issues.xlsx:cweijan-570 标注「参考cweijan方式完成处理」并关联本 plan;590 在比对确认后按结论回填备注。

## 验证方式

- 每批移植后的回归基线:test-workspace 已登记的对应格式复现文件;
- 新增样例:带注释的 csv、嵌套公式 xlsx、含 wikilink 的 md,放入 test-workspace 并在 README 登记表补行;
- 发版前完整走一遍 release skill 流程(lint → build → package)。

## 实施记录(2026-11-20,分支 chore/sync-upstream)

七批全部移植完成,每批独立提交(提交信息含 sync-upstream 与原提交号):

| 批次 | 提交 | 内容 |
| --- | --- | --- |
| 1 | `43c984f` | excel 平滑滚动 + 缩放选框(46cbde1 59f51f5,干净套用) |
| 2 | `5c36cfa` | markdown 滚动回顶/IR 代码块/路径解析(b271e89 e56806c bfc130b;e56806c 与 bfc130b 手工合) |
| 3 | `784fb09` | git 去重/zip utf8/pdf 高对比/表格删除(3aad0e6 69a6932 32c2a53 9949595;32c2a53 手工合,repoDiscovery 清 unused import) |
| 4 | `cfd3d83` | 嵌套公式 + 自研 csv 解析(4e126ae edb7ba2,重冲突手工融合,见下) |
| 5 | `827d92c` | wikilink 两件/图片路径还原/iframe(ec4e3fd 手工合;fbe92ef 确认与本地 590 同源跳过) |
| 6 | `a364a50` | 图片窗口化加载/滚轮记忆(c962435 9d46278,取 upstream 整文件后回放 SponsorBar 移除;4864643 本地已覆盖跳过) |
| 7 | `0f58b9a` | 链接错误 toast/解压通知 UI(c5fffd6 18c4768,nls 10 语言手工插入两条,provider/open.ts/Zip.tsx 手工合) |
| 补 | `dbdc0e3` | wikilink 测试跨平台适配(Chrome 路径探测 + lute 产物路径) |

批 4 的关键融合决策:

- 上游 4e126ae 重写 cell.js 为 AST 递归求值,`$A$1` 绝对引用、`#CYCLE!` 循环保护、错误传播原生支持,
  本地旧补丁 a97a480($ 公式)被完全覆盖,不回放;
- 上游删除 formulaCache 改为 numFmt + 实时求值,本地已用 formulaValue(`<v>` 缓存值)替代 formulaCache,
  两套语义并入新文件 excel_cell_display.ts:formulaValue 优先(592)→ 求值失败 #VALUE!(604)→ SSF.numFmt;
- percent 格式保留本地实现(支持 formatDecimals,优于上游固定 2 位);
- edb7ba2 的「注释支持」实为 parser 健壮性改进,parseCsv 额外暴露 limit 参数保留 239 的流式截断;
- 去除 udsv 依赖(package.json)。

验证结果:

- `npm run lint:fix` 0 error(仅剩既有 Excel.tsx hook 依赖 warning,非本次引入);
- `npm run build` 通过(vite 334 模块 + esbuild 宿主);
- `node --test test/markdown/` 4/4 通过(documentSync 3 + wikilinkBoundary 1);
- issues.xlsx/ISSUES.md 已回填 570(参考cweijan方式完成处理,备注吸收提交号)。

## 进度

- [x] P1 九项移植与验证
- [x] P2 八项移植与验证(fbe92ef 确认同源跳过)
- [x] issues.xlsx 回填(570;590 无需回填,本地修复早于同步且未受影响)
- [x] 发版 4.3.0:用户选择跳过专门手测直接发版(信任 build + node --test 基线),
      main 合入(ff)、CHANGELOG 中英条目(含上游基线注记)、package 出
      `release/vscode-office-enhance-4.3.0.vsix`、tag `v4.3.0` 触发 CI 发布;
      后续 F5 手测核心链路(excel 打开/保存、md 编辑保存、pdf、zip、图片)发现问题按普通 issue 处理
