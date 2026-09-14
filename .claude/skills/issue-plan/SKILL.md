---
name: issue-plan
description: 为上游 cweijan/vscode-office 的 issue 生成处理 plan(docs/plans/plan-cweijan-issues-*.md)与 test-workspace 复现文件,并回填 issues.xlsx 关联列。用法 /issue-plan all(批量全部待处理 bug)或 /issue-plan 157 592(指定编号);用户提到「生成 issue plan」「给 issue 建复现文件」「issue 处理方案初始化」时也应触发。
---

# issue plan 生成(issue-plan)

为上游 issue 批量初始化处理方案:抓取 issue 详情 → 生成 plan 骨架(issue 信息完整 + 复现数据做实)→
生成 test-workspace 复现文件 → 回填 `issues.xlsx` 关联列。**不做根因分析与代码修复**,
plan 中「根因定位/修复方案/验证方式」留 `{待分析}` 占位,留待后续逐个深入。

命名与骨架规范见 [docs/plans/agent.md](../../../docs/plans/agent.md),完整参照样例
[docs/plans/plan-cweijan-issues-597-word-toc.md](../../../docs/plans/plan-cweijan-issues-597-word-toc.md)。

## 第 1 步:解析参数,确定目标编号

- `$ARGUMENTS` = `all`:目标为 `issues.xlsx` 中「标签含 bug 且 关联plan文件路径 为空」的全部编号;
- `$ARGUMENTS` = 编号列表(空格/逗号分隔,如 `157 592` 或 `604,607`):按编号处理,**不限 bug 标签**
  (无标签的缺陷报告如 604/607/295/589 也可用此方式补);
- 无参数:执行第 2 步后,用 AskUserQuestion 列出候选(编号+标题,multiSelect)让用户勾选。

## 第 2 步:读取 issues.xlsx

```bash
python -X utf8 -c "
import pandas as pd, sys
sys.stdout.reconfigure(encoding='utf-8')
df = pd.read_excel('docs/issues/cweijan-issues/issues.xlsx')
cols = ['编号','标题','标签','处理状态','关联plan文件路径']
print(df[df['编号'].isin([157,592])][cols].to_string(index=False))
"
```

编号不在表中的,先向用户确认是否仍要生成(如本仓库自身 issue 应走 `plan-my-issues-*` 前缀)。

## 第 3 步:抓取 issue 详情(逐个,三级兜底)

对每个编号,按顺序尝试,成功即止:

1. `gh issue view {编号} -R cweijan/vscode-office --json number,title,body,labels,url`
2. 匿名 REST API:`https://api.github.com/repos/cweijan/vscode-office/issues/{编号}`
   (python urllib,匿名限额 60 次/小时,403 rate limit 时转下一级)
3. WebFetch `https://github.com/cweijan/vscode-office/issues/{编号}`,
   prompt:「提取该 issue 的完整信息:标题、正文(问题描述、复现步骤、期望行为、实际行为、环境版本)、评论要点,原样保留关键细节」

需要的信息:title、body、labels、url;评论中有维护者结论的也摘录。

## 第 4 步:定 slug 与格式目录

- **slug**:2-4 个英文词、连字符分隔、能看懂功能模块,与 plan 文件名 `{主题}` 同源
  (如 #157 → `list-nested-table`、#592 → `formula-percent-nan`);
- **格式目录**(复现文件放置位置,按查看器归):

| 格式 | test-workspace 目录 | 常见扩展名 |
| --- | --- | --- |
| markdown | `markdown/` | .md |
| excel | `excel/` | .xlsx / .csv |
| word | `word/` | .docx |
| pdf | `pdf/` | .pdf |
| html | `html/` | .html |

交互类 bug(快捷键/粘贴/焦点/滚动等)按其涉及的查看器归格式,复现文件只是操作载体。

## 第 5 步:生成 plan(幂等,已存在则跳过)

路径:`docs/plans/plan-cweijan-issues-{编号}-{slug}.md`,UTF-8、LF。模板:

```markdown
# issue信息

## issue链接

{issue URL}

## 标题

{title}

## 标签

{labels 逗号分隔}

## 问题描述

{从 issue 正文摘录整理,保留复现步骤、环境与版本}

## 期望行为

{正文中的期望;未明写的按合理推断并注明}

## 实际行为

{正文中的现象描述,含截图说明(如有)}

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/{格式}/test-{格式}-cweijan-{编号}-{slug}.{ext}`
生成脚本: `test-workspace/_generate/issue_{编号}_{slug}.py`{或 .mjs;文本类手写无脚本则写「文本文件,直接维护」}

文件内容说明: {复现文件构造了什么场景,与 issue 现象的对应关系}

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. {具体操作};
3. 预期: {...};实际: {...}。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
```

## 第 6 步:生成复现文件

命名:`test-{格式}-cweijan-{编号}-{slug}.{ext}`,放 `test-workspace/{格式目录}/`。三分支:

1. **文本格式(md/html)**:直接 Write,内容最小化构造 bug 场景(只含触发该 bug 所需的结构);
2. **二进制格式(docx/xlsx/pdf/csv 等)**:写生成脚本 `test-workspace/_generate/issue_{编号}_{slug}.py`
   (openpyxl / python-docx / Pillow,风格参照 [issue_597_variants.py](../../../test-workspace/_generate/issue_597_variants.py))
   或 `.mjs`(pdf-lib 等,参照 [generate.mjs](../../../test-workspace/_generate/generate.mjs)),脚本头部注释写明对应 issue,然后执行生成;
3. **交互类 bug**:最小基础文件(几行文本/一个代码块/一张图等操作对象)+ 详细手动复现步骤写入 plan。

所有脚本输出路径、plan 中引用路径一律用相对仓库根的 POSIX 风格路径。

## 第 7 步:回填与登记(批量处理时,全部生成完后统一执行一次)

1. 回填 xlsx(只写「关联plan文件路径」列,**不动 处理状态/备注 等人工列**):

```bash
python -X utf8 -c "
from openpyxl import load_workbook
wb = load_workbook('docs/issues/cweijan-issues/issues.xlsx')
ws = wb['issues']
COL = 8  # 关联plan文件路径
targets = {157: 'docs/plans/plan-cweijan-issues-157-list-nested-table.md'}  # 按实际产物
for idx, r in enumerate(ws.iter_rows(min_row=2), start=2):
    if r[0].value in targets:
        ws.cell(idx, COL, targets[r[0].value])
wb.save('docs/issues/cweijan-issues/issues.xlsx')
"
```

2. 刷新只读快照:`cd docs/issues/cweijan-issues && python -c "import sync_issues; sync_issues.write_md_snapshot()"`;
3. 在 [test-workspace/README.md](../../../test-workspace/README.md) 的「issue 复现文件」表格登记:
   `| [#{编号}]({issue URL}) | {复现文件路径} | {生成脚本路径或 -} | [plan](../docs/plans/xxx.md) |`。

## 第 8 步:汇报

按编号列出:plan 路径、复现文件路径、是否交互类(需手动操作复现)。有 issue 正文抓取失败的单独标出。
