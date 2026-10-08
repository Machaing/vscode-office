# -*- coding: utf-8 -*-
"""生成 issue-415 复现数据: 用于 AWS Toolkit S3 保存测试的最小 xlsx

issue 现象: 通过 AWS Toolkit for VSCode 打开 S3 上的 .xlsx 编辑后保存,
弹出 "Unable to open S3 file, try reopening from the explorer."。
保存链路依赖 AWS Toolkit 的 S3 远程文件(非 file:// scheme), 无法本地自动复现;
本脚本仅生成上传到 S3 的载体文件, 手动复现步骤见
docs/plans/plan-cweijan-issues-415-s3-save-error.md。
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

from openpyxl import Workbook

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "excel", "test-excel-cweijan-415-s3-save-error.xlsx")


def main():
    wb = Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    ws["A1"] = "issue-415 S3 save test"
    ws.append(["Name", "Value"])
    ws.append(["alpha", 1])
    ws.append(["beta", 2])
    ws.append(["gamma", 3])
    wb.save(OUT)
    print(f"written: {OUT}")


if __name__ == "__main__":
    main()
