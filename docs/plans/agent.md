# docs/plans 命名规范

本目录存放全部计划/处理方案文档,通过文件名前缀快速区分文档类型:

## 命名规则

| 前缀 | 类型 | 示例 |
| --- | --- | --- |
| `plan-cweijan-issues-{编号}-{主题}.md` | 上游(cweijan) issue 的处理方案 | `plan-cweijan-issues-597-word-toc.md` |
| `plan-my-issues-{编号}-{主题}.md` | 本仓库自身 issue 的处理方案 | `plan-my-issues-12-export-pdf.md` |
| `plan-{主题}.md` | 其他计划(依赖升级、重构、功能设计等) | `plan-dependency-upgrade.md` |

- `{编号}`: 对应仓库的 issue 号;`{主题}`: 小写英文短语,连字符分隔,能看懂涉及的功能模块
- 一类主题多个文档时用更细的 slug 区分,不再建子目录
- **按处理状态分放子目录**: 新建的 plan 落 `todo/`(含 `{待分析}` 占位或未实施的设计);
  完成后按下节「完成归档」流程移入 `done/`

## 完成归档

plan 满足以下条件即视为完成,应从 `todo/` 归档到 `done/`:

1. 根因已定位并写入 plan;
2. 修复已实施并验证(实测复现文件 + 回归基线),或确认无需代码修复(如已被其他 issue 的修复覆盖),
   并把结论写入 plan 的「修复方案 / 验证方式」,不留 `{待分析}` 占位。

归档步骤:

1. `git mv docs/plans/todo/plan-*.md docs/plans/done/`;
2. 同步四处引用:
   - `docs/issues/cweijan-issues/issues.xlsx`: 「处理状态」列改为 `本项目处理`(参照 cweijan 原版实现的用
     `参考cweijan方式完成处理`)、「关联plan文件路径」列改为 `done/` 路径、「备注」列补
     `YYYY-MM-DD核查:结论` 一句话;
   - `docs/issues/cweijan-issues/ISSUES.md` 只读快照中该 issue 的行(处理状态与关联 plan 列,与 xlsx 保持一致);
   - `test-workspace/README.md` 复现文件登记表中的 plan 链接改为 `done/` 路径;
   - plan 内部指向仓库根/兄弟目录的 markdown 相对链接(子目录深度多一级,需改为 `../../../`);
3. 提交信息沿用 issue 文档惯例,如 `docs(issues,cweijan-607): 实测验证通过,plan 归档至 done`。

## 与其他目录的关系

```
docs/
├── plans/                        # 本目录: 处理方案与计划(产出"怎么做")
│   ├── todo/                     # 未完成: 待分析骨架、未实施的设计
│   └── done/                     # 已完成: 含修复记录与验证结论的归档
├── issues/
│   ├── cweijan-issues/           # 上游仓库 issue 跟踪: 同步脚本 + issues.xlsx + ISSUES.md 快照
│   └── my-issues/                # 本仓库自身 issue 的记录
```

- 上游 issue 的**清单与状态**由 `docs/issues/cweijan-issues/sync_issues.py` 维护
  (只同步 open 状态的 issue, 历史 closed 不主动拉取; 已登记的 issue 被上游关闭时
  更新"上游状态"并保留该行; `issues.xlsx` 人工维护处理状态, `ISSUES.md` 为只读快照供 README 引用);
- 涉及代码修复的 issue 落 `todo/plan-cweijan-issues-{编号}-{主题}.md`(上游, 可由
  `sync_issues.py --init` 生成骨架) 或 `todo/plan-my-issues-{编号}-{主题}.md`(本仓库) 详细方案,
  上游 issue 需把路径回填到 xlsx 的"关联 plan 文件路径"列。

## plan-issue 文档骨架

```markdown
# issue信息

## issue链接
{上游 issue URL}

## 标题
{issue 标题原文}(附报告者、创建时间、当前状态、标签)

## 问题描述-原文
{逐字引用 issue 正文 markdown 源码,禁止转述/概括/改写;
正文中的图片下载到 docs/plans/images/{plan 文件名(不含扩展名)}-{时间戳}.{ext}
(如 plan-cweijan-issues-323-switch-editor-shortcut-1791365015.png,时间戳为 unix 秒),
以相对路径 ../images/ 嵌入,不得只留 GitHub 外链(其图片 URL 带时效签名,过期失效)}

## 问题评论信息
{逐字引用全部评论(作者、时间、原文),保留原文拼写;
评论中引用的 PR/issue 链接附「标题 + 当前状态」;无评论则写「无评论」}

## 问题描述-中文
{正文的中文翻译;截图需亲验后转写其中的关键信息(键位、路径、报错文案等)}

## 问题评论信息-中文
{评论的中文翻译;无评论则写「无」}

## 期望行为 / 实际行为
{基于原文归纳;属推断时注明}

# 问题确认及解决

## 复现数据 / 根因定位 / 修复方案 / 验证方式 / 修复记录
{分析结论}
```

**信息还原原则**(由 plan-cweijan-issues-323 的教训确立:首版未还原自定义键位截图与 PR 评论,
浪费了排查时间):

1. 原文与评论优先用 GitHub API 获取逐字内容(`GET /repos/cweijan/vscode-office/issues/{n}`
   与 `.../issues/{n}/comments`),WebFetch 页面抓取仅作兜底且需人工核对;
2. 截图必须下载归档并亲验内容(而非依据外链或他人转述),截图里的键位/路径/报错等细节
   常是根因关键;
3. 「问题描述-原文」等四个信息章节在任何情况下不得以分析者的改写替代原始信息,
   分析性内容(如「本仓库现状」)另立小节明确区分。

「复现数据」应链接 `test-workspace/` 下的复现文件(命名 `test-{格式}-cweijan-{编号}-{slug}.{ext}`,
登记表见 [test-workspace/README.md](../../test-workspace/README.md));plan 与复现文件的批量生成流程
见 [.claude/skills/issue-plan/SKILL.md](../../.claude/skills/issue-plan/SKILL.md)。

## 行文自查清单(「问题确认及解决」章节)

「问题确认及解决」是本仓库自己的分析产出(区别于逐字还原的 issue 原文),面向中文读者;
plan 初稿生成后、归档前,按以下清单通读检查一遍(由 plan-cweijan-issues-415 的返工教训确立):

1. **冒号只用于引导,不接完整句**:「术语说明:」+列表、「按收益排序:」+编号项、条目式
   「**步骤 4**(...)：改动前…」是合法用法;**无谓语的名词短语直接冒号接完整句子是病句**,
   名词后还插长括号时尤甚。反例:「VS Code 对这类模式的匹配规则(见 vscode 源码 …):
   模式不含 / 时只按文件名匹配…」;应为插入语开头的陈述句:「按 VS Code 的匹配规则
   (见 vscode 源码 …),模式不含 `/` 时只按文件名匹配…」;
2. **术语首次出现要有注释**:scheme、provider、selector、防抖等英文术语,在该章节开头用
   「术语说明」引用块统一注释,或行内括号就地注释;目标是读者不查资料能读懂全篇;
3. **不用黑话与翻译腔**:「prepend 候选表」→「插到候选表最前面」、「defer 给 vscode.open」
   →「转交 vscode.open」、「三件套」→「三条并列的模式」、「workaround」→「绕行办法」等;
   英文函数名(existsSync/clone/bundle)不当中文动词用,代码名只出现在反引号或括号里,
   动作本身用中文表述(「逐个检查文件是否存在」「完整复制整棵 DOM」);
4. **代码链路写成叙述**:不堆「A.tsx:366 → B.ts:203 emit('save') → C.ts:59 writeFile(uri, res)」
   式箭头链,改为有主语有动词的句子;箭头链只保留在一句话内的简短流程概括处;
5. **行号引用可点击**:本仓库文件写成 markdown 链接(如 `[table.js:100](../../../src/…#L100)`);
   第三方仓库(aws-toolkit-vscode、puppeteer-core 等)的行号保持纯文本并注明所属仓库;
6. **结构建议**:根因定位以「结论先行」加粗段开头,再分小节展开(现象怎么发生 → 为什么
   呈现这个表现 → 推断部分单独标注「推断」),每小节首句先给该节结论;
7. **标点用中文全角**:行文中的逗号、分号、冒号、括号、问号、感叹号用全角（，；：（）？！），
   不混入半角英文标点,全角冒号后不加空格。保持半角的例外:反引号/代码块内的内容、
   markdown 链接语法与 URL、`file.ts:123` 类行号记号、英文引号内的英文原文句子
   (如报错文案 "Not chromium found, export fail.")、「问题描述-原文」等逐字还原章节。
