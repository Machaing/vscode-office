# -*- coding: utf-8 -*-
"""同步上游 cweijan/vscode-office 的 **open** issue 到本目录的 issues.xlsx 与 ISSUES.md 快照。

用法:
    python sync_issues.py              # 同步上游 open issue, 增量更新 xlsx 并刷新 ISSIES.md
    python sync_issues.py --init 597 word-toc
                                       # 在 docs/plans/ 生成 plan-cweijan-issues-597-word-toc.md 骨架

依赖: openpyxl; gh CLI 未安装时自动回退 GitHub REST API(匿名限额 60 次/小时)。

同步语义(只关心 open):
  - 只拉取上游 state=open 的 issue, 历史 closed 的不主动进表;
  - 表中已登记的 issue 若后来被上游关闭(增量 closed), 更新"上游状态/上游关闭时间"
    并把该行保留在表中作为追踪记录; 已确认为 closed 的行不再重复查询;
  - 人工只维护 issues.xlsx 的 处理状态/关联plan文件路径/备注 三列,
    每次同步脚本不会覆盖人工列; ISSUES.md 为自动生成的只读快照。
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
UPSTREAM = "cweijan/vscode-office"
XLSX = os.path.join(HERE, "issues.xlsx")
MD = os.path.join(HERE, "ISSUES.md")

COLUMNS = ["编号", "标题", "标签", "链接", "上游状态", "上游关闭时间",
           "处理状态", "关联plan文件路径", "登记时间", "最近同步时间", "备注"]
STATUS_VALUES = ["待处理", "参考cweijan方式完成处理", "本项目处理", "忽略"]


def fetch_issues():
    """拉取上游 open 状态 issue: 优先 gh CLI, 未安装时走 GitHub REST API(需过滤 PR)"""
    try:
        out = subprocess.run(
            ["gh", "issue", "list", "-R", UPSTREAM, "--state", "open", "--limit", "2000",
             "--json", "number,title,url,state,labels,closedAt"],
            capture_output=True, text=True, encoding="utf-8", check=True)
        issues = json.loads(out.stdout)
    except FileNotFoundError:
        issues = fetch_issues_api()
    issues.sort(key=lambda i: i["number"])
    return issues


def fetch_issues_api():
    """无 gh 时直接调 REST API(匿名限额 60 次/小时, open 通常 1 页)"""
    import time
    issues, page = [], 1
    while True:
        url = (f"https://api.github.com/repos/{UPSTREAM}/issues"
               f"?state=open&per_page=100&page={page}")
        batch = None
        for attempt in range(3):  # 网络不稳(IncompleteRead/超时)时重试
            try:
                with urllib.request.urlopen(url, timeout=60) as resp:
                    batch = json.loads(resp.read().decode("utf-8"))
                break
            except Exception as e:
                if attempt == 2:
                    raise
                print(f"请求失败({e.__class__.__name__}), 重试 {attempt + 1}/3 ...")
                time.sleep(2 * (attempt + 1))
        if not batch:
            break
        for it in batch:
            if "pull_request" in it:  # issues API 会混入 PR
                continue
            issues.append({
                "number": it["number"], "title": it["title"], "url": it["html_url"],
                "state": it["state"], "closedAt": it.get("closed_at"),
                "labels": [{"name": l["name"]} for l in it.get("labels", [])],
            })
        page += 1
    return issues


def fetch_issue_detail(number):
    """查询单个 issue 最新状态(增量 closed 追踪/生成 plan 用): gh 优先, 回退 REST API"""
    try:
        out = subprocess.run(
            ["gh", "issue", "view", str(number), "-R", UPSTREAM,
             "--json", "number,title,url,state,labels,closedAt"],
            capture_output=True, text=True, encoding="utf-8", check=True)
        return json.loads(out.stdout)
    except FileNotFoundError:
        return fetch_issue_detail_api(number)


def fetch_issue_detail_api(number):
    url = f"https://api.github.com/repos/{UPSTREAM}/issues/{number}"
    with urllib.request.urlopen(url, timeout=60) as resp:
        it = json.loads(resp.read().decode("utf-8"))
    if "pull_request" in it:  # 编号被占用为 PR 的极端情况
        raise ValueError(f"#{number} 是 Pull Request 而非 issue")
    return {
        "number": it["number"], "title": it["title"], "url": it["html_url"],
        "state": it["state"], "closedAt": it.get("closed_at"),
        "labels": [{"name": l["name"]} for l in it.get("labels", [])],
    }


def load_workbook_rows():
    """读取现有 xlsx; 不存在返回 (None, [])"""
    if not os.path.exists(XLSX):
        return None, []
    from openpyxl import load_workbook
    wb = load_workbook(XLSX)
    ws = wb.active
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0] is None:
            continue
        rows.append(dict(zip(COLUMNS, r)))
    return wb, rows


def build_or_update(issues):
    from openpyxl import Workbook, load_workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.datavalidation import DataValidation

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    wb, existing = load_workbook_rows()
    existing_by_no = {int(r["编号"]): r for r in existing}

    created = not os.path.exists(XLSX)
    if created:
        wb = Workbook()
        ws = wb.active
        ws.title = "issues"
        ws.append(COLUMNS)
    else:
        wb = load_workbook(XLSX)
        ws = wb["issues"]

    added = 0
    for it in issues:
        no = it["number"]
        labels = ",".join(l["name"] for l in it.get("labels", []))
        if no in existing_by_no:
            # 只更新上游侧字段, 人工列(处理状态/plan/备注/登记时间)不动
            row_idx = None
            for idx, r in enumerate(ws.iter_rows(min_row=2), start=2):
                if r[0].value == no:
                    row_idx = idx
                    break
            if row_idx is None:
                continue
            ws.cell(row_idx, COLUMNS.index("标题") + 1, it["title"])
            ws.cell(row_idx, COLUMNS.index("标签") + 1, labels)
            ws.cell(row_idx, COLUMNS.index("上游状态") + 1, it["state"])
            ws.cell(row_idx, COLUMNS.index("上游关闭时间") + 1,
                    (it.get("closedAt") or "")[:10])
            ws.cell(row_idx, COLUMNS.index("最近同步时间") + 1, now)
        else:
            ws.append([no, it["title"], labels, it["url"], it["state"],
                       (it.get("closedAt") or "")[:10], "待处理", "", now, now, ""])
            added += 1

    # 增量 closed 追踪: 表中上次记录为 open、但本次 open 列表已不含的编号,
    # 逐个查最新状态; 确认 closed 则更新并保留该行, 已是 closed 的行不再查询。
    # (open 列表 upsert 已天然覆盖 reopen: closed 行重新出现在 open 列表会被更新回 open)
    open_nos = {it["number"] for it in issues}
    candidates = []
    for idx, r in enumerate(ws.iter_rows(min_row=2), start=2):
        if r[0].value is None:
            continue
        no = int(r[0].value)
        if no not in open_nos and r[COLUMNS.index("上游状态")].value == "open":
            candidates.append((idx, no))
    closed_now = 0
    for idx, no in candidates:
        try:
            detail = fetch_issue_detail(no)
        except Exception as e:
            print(f"  #{no} 状态查询失败({e.__class__.__name__}), 跳过")
            continue
        if detail["state"] == "closed":
            ws.cell(idx, COLUMNS.index("上游状态") + 1, "closed")
            ws.cell(idx, COLUMNS.index("上游关闭时间") + 1,
                    (detail.get("closedAt") or "")[:10])
            ws.cell(idx, COLUMNS.index("最近同步时间") + 1, now)
            closed_now += 1
            print(f"  #{no} 已被上游关闭, 更新状态并保留")

    # 表头样式/列宽/冻结/下拉校验
    header_fill = PatternFill("solid", fgColor="4472C4")
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = header_fill
        c.alignment = Alignment(horizontal="center", vertical="center")
    for i, w in enumerate([8, 60, 18, 46, 10, 13, 24, 40, 18, 18, 24], start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    status_col = get_column_letter(COLUMNS.index("处理状态") + 1)
    dv = DataValidation(type="list", formula1='"' + ",".join(STATUS_VALUES) + '"',
                        allow_blank=False, showErrorMessage=True)
    dv.error = "处理状态必须为: " + " / ".join(STATUS_VALUES)
    ws.add_data_validation(dv)
    dv.add(f"{status_col}2:{status_col}{ws.max_row + 50}")

    wb.save(XLSX)
    return created, added, closed_now, len(issues)


def write_md_snapshot():
    """从 xlsx 生成 ISSUES.md 只读快照"""
    from openpyxl import load_workbook
    wb = load_workbook(XLSX)
    ws = wb["issues"]
    rows = [dict(zip(COLUMNS, r)) for r in ws.iter_rows(min_row=2, values_only=True) if r[0]]

    def esc(s):
        return str(s or "").replace("|", "\\|")

    lines = [
       	"# 上游 issue 跟踪(cweijan/vscode-office)",
        "",
       	"> 本文件由 [sync_issues.py](sync_issues.py) 自动生成,请勿手编。",
       	"> 人工维护请编辑 [issues.xlsx](issues.xlsx) 的 `处理状态` / `关联plan文件路径` / `备注` 列。",
        "",
    ]
    stat = {v: 0 for v in STATUS_VALUES}
    for r in rows:
        key = r.get("处理状态") or "待处理"
        stat[key] = stat.get(key, 0) + 1
    lines.append("处理进度: " + " · ".join(f"{k} {v}" for k, v in stat.items()))
    lines += [
        "",
        "| 编号 | 标题 | 标签 | 上游状态 | 处理状态 | 关联 plan |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        plan = esc(r.get("关联plan文件路径"))
        lines.append(
            f"| [#{r['编号']}]({r['链接']}) | {esc(r['标题'])} | {esc(r['标签'])} "
            f"| {esc(r['上游状态'])} | {esc(r.get('处理状态'))} | {plan} |")
    lines.append("")
    open(MD, "w", encoding="utf-8", newline="\n").write("\n".join(lines))


def init_plan(number, slug):
    """在 docs/plans/ 生成 plan-cweijan-issues-{number}-{slug}.md 骨架, 并回填 xlsx 关联列"""
    plans_dir = os.path.join(REPO, "docs", "plans")
    name = f"plan-cweijan-issues-{number}-{slug}.md"
    path = os.path.join(plans_dir, name)
    if os.path.exists(path):
        print("已存在:", path)
        return
    it = fetch_issue_detail(number)
    labels = ",".join(l["name"] for l in it.get("labels", []))
    content = f"""# issue信息

## issue链接

{it['url']}

## 标题

{it['title']}

## 标签

{labels}

## 问题描述

{{从 issue 页面摘录}}

# 问题确认及解决

## 复现数据

{{test-workspace 中的复现文件或生成脚本}}

## 根因定位

{{分析}}

## 修复方案

{{方案}}

## 验证方式

{{验证步骤}}
"""
    open(path, "w", encoding="utf-8", newline="\n").write(content)
    # 回填 xlsx
    from openpyxl import load_workbook
    wb = load_workbook(XLSX)
    ws = wb["issues"]
    for idx, r in enumerate(ws.iter_rows(min_row=2), start=2):
        if r[0].value == int(number):
            ws.cell(idx, COLUMNS.index("关联plan文件路径") + 1, f"docs/plans/{name}")
            break
    wb.save(XLSX)
    write_md_snapshot()
    print("已生成:", path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--init", nargs=2, metavar=("NUMBER", "SLUG"),
                        help="生成 plan-issue-N-slug.md 骨架并回填 xlsx")
    args = parser.parse_args()

    if args.init:
        init_plan(args.init[0], args.init[1])
        return

    try:
        issues = fetch_issues()
    except FileNotFoundError:
        sys.exit("错误: 未找到 gh CLI, 请安装并登录: https://cli.github.com/")
    except subprocess.CalledProcessError as e:
        sys.exit(f"错误: gh 调用失败: {e.stderr}")
    created, added, closed_now, total = build_or_update(issues)
    write_md_snapshot()
    action = "新建" if created else "更新"
    print(f"已{action} {XLSX}")
    print(f"本次同步上游 open issue {total} 个, 新增 {added} 个, "
          f"追踪到被关闭 {closed_now} 个; 快照已刷新: {MD}")


if __name__ == "__main__":
    main()
