# -*- coding: utf-8 -*-
"""生成 issue-589 复现数据: 模拟 CC 长任务输出的大体积 markdown

上游 issue #589: CC 跑长任务期间点击 markdown 文档, 加载 10-20 分钟。
用法:
  python issue_589_large_file_slow_load.py          # 生成约 TARGET_MB 的大 md(场景 A: 纯大文件)
  python issue_589_large_file_slow_load.py --append # 持续向该文件追加写入, Ctrl+C 停止
                                                     # (场景 B: 边写边开, 模拟 CC 写日志)
"""
import os
import sys
import time

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "markdown", "test-markdown-cweijan-589-large-file-slow-load.md")

TARGET_MB = 5          # 目标体积(MB), 无感时逐步调大到 10/50
APPEND_INTERVAL = 2.0  # --append 模式写入间隔(秒)


def section(n: int) -> str:
    return f"""## 任务日志 第 {n} 节

Claude Code 正在执行长任务,本节记录第 {n} 轮工具调用与结论。分析过程中产出了
若干中间结论与代码片段,真实场景中此类文档会随任务推进持续增长到数 MB 甚至更大。

- 工具调用: `Grep` / `Read` / `Edit`,共 {n * 3} 次
- 修改文件: `src/example-{n}.ts`
- 结论: 第 {n} 轮检查通过,继续下一轮

| 步骤 | 操作 | 耗时(s) | 状态 |
| --- | --- | --- | --- |
| {n * 4 - 3} | 定位符号 | 0.3 | ok |
| {n * 4 - 2} | 读取上下文 | 1.2 | ok |
| {n * 4 - 1} | 应用修改 | 0.5 | ok |
| {n * 4} | 回归验证 | 2.0 | ok |

```ts
// 第 {n} 轮生成的示例代码块, 渲染引擎需对其做语法高亮
export function step{n}(input: string): string {{
  const result = input.trim().repeat({n % 5 + 1});
  return `[{n}] ${{result}}`;
}}
```

本节结束。后续小节继续追加同类内容。
"""


def generate():
    header = (
        "<!-- issue: https://github.com/cweijan/vscode-office/issues/589\n"
        "     现象: CC 长任务期间点击打开 markdown 文档, 加载 10-20 分钟(扩展 4.1.3);\n"
        "     由 issue_589_large_file_slow_load.py 生成, 体积/行数可在脚本头部调整 -->\n\n"
        "# CC 长任务日志复现(issue-589)\n\n"
        f"目标体积约 {TARGET_MB} MB,由混合结构(标题/段落/列表/表格/代码块)循环构成。\n\n"
    )
    size = len(header.encode("utf-8"))
    limit = TARGET_MB * 1024 * 1024
    n = 0
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(header)
        while size < limit:
            chunk = section(n + 1)
            f.write(chunk)
            size += len(chunk.encode("utf-8"))
            n += 1
    print(f"生成: {OUT}({size / 1024 / 1024:.2f} MB, {n} 节)")


def append():
    n = 0
    print(f"持续追加写入: {OUT}(每 {APPEND_INTERVAL}s 一节, Ctrl+C 停止)")
    with open(OUT, "a", encoding="utf-8", newline="\n") as f:
        while True:
            n += 1
            chunk = section(10000 + n)
            f.write(chunk)
            f.flush()
            print(f"  已追加第 {n} 节(+{len(chunk.encode('utf-8')) / 1024:.1f} KB)")
            time.sleep(APPEND_INTERVAL)


if __name__ == "__main__":
    if "--append" in sys.argv:
        append()
    else:
        generate()
