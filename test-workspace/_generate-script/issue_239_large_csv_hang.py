# -*- coding: utf-8 -*-
"""生成 issue-239 复现数据: 大体积 CSV(12 万行 x 9 列浮点数)

上游 issue #239 报告打开约 100MB(100 万行 x 9 列)的 CSV/XLSX 时窗口挂起。
受仓库体积限制, 这里生成同结构的 12 万行(约 12MB)版本;
需要更大文件时调整 ROWS 常量(100 万行约 100MB)。
"""
import csv
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "excel", "test-excel-cweijan-239-large-csv.csv")

ROWS = 120_000
COLS = 9


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # 确定性伪随机(LCG), 保证每次生成的文件内容一致
    state = 123456789
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([f"col{i + 1}" for i in range(COLS)])
        for _ in range(ROWS):
            row = []
            for _ in range(COLS):
                state = (1103515245 * state + 12345) % (2 ** 31)
                row.append(f"{(state % 100000) / 100:.6f}")
            writer.writerow(row)
    size_mb = os.path.getsize(OUT) / 1024 / 1024
    print(f"生成: {OUT} ({ROWS} 行 x {COLS} 列, {size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
