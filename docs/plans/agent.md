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

## 与其他目录的关系

```
docs/
├── plans/                        # 本目录: 处理方案与计划(产出"怎么做")
├── issues/
│   ├── cweijan-issues/           # 上游仓库 issue 跟踪: 同步脚本 + issues.xlsx + ISSUES.md 快照
│   └── my-issues/                # 本仓库自身 issue 的记录
```

- 上游 issue 的**清单与状态**由 `docs/issues/cweijan-issues/sync_issues.py` 维护
  (只同步 open 状态的 issue, 历史 closed 不主动拉取; 已登记的 issue 被上游关闭时
  更新"上游状态"并保留该行; `issues.xlsx` 人工维护处理状态, `ISSUES.md` 为只读快照供 README 引用);
- 涉及代码修复的 issue 在本目录落 `plan-cweijan-issues-{编号}-{主题}.md`(上游, 可由
  `sync_issues.py --init` 生成骨架) 或 `plan-my-issues-{编号}-{主题}.md`(本仓库) 详细方案,
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
