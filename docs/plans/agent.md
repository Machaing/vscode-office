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

## 标题 / 问题描述 / 期望行为 / 实际行为
{从 issue 页面摘录}

# 问题确认及解决

## 复现数据 / 根因定位 / 修复方案 / 验证方式 / 修复记录
{分析结论}
```

「复现数据」应链接 `test-workspace/` 下的复现文件(命名 `test-{格式}-cweijan-{编号}-{slug}.{ext}`,
登记表见 [test-workspace/README.md](../../test-workspace/README.md));plan 与复现文件的批量生成流程
见 [.claude/skills/issue-plan/SKILL.md](../../.claude/skills/issue-plan/SKILL.md)。
