# -*- coding: utf-8 -*-
"""生成 issue-604 复现数据: 3 层嵌套 IF 公式导致 xlsx 查看器打开崩溃

上游 issue #604: B1==IF(A1="S",1,IF(A1="M",3,IF(A1="L",5,0))) 时打开报
"Cannot read properties of undefined (reading '0')",2 层嵌套正常。
本脚本构造对照布局:
  B 列 = 3 层嵌套(openpyxl 原生, 无缓存 <v>)         -> 核心复现
  C 列 = 3 层嵌套 + 注入缓存值(贴近 Excel 保存文件)   -> 验证缓存 fallback
  D 列 = 2 层嵌套(issue 报告正常)                     -> 对照
  E 列 = 1 层                                          -> 对照
第 2 行换 A2=S/L 覆盖 else 链深处分支。注入方式参照 issue_592_formula_percent_nan.py。
"""
import os
import re
import sys
import zipfile

sys.stdout.reconfigure(encoding="utf-8")

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "excel", "test-excel-cweijan-604-nested-if-crash.xlsx")
TMP = os.path.join(ROOT, "_generate-script", "_604_tmp.xlsx")

NESTED3 = '=IF(A{r}="S",1,IF(A{r}="M",3,IF(A{r}="L",5,0)))'
NESTED2 = '=IF(A{r}="S",1,IF(A{r}="M",3,0))'
NESTED1 = '=IF(A{r}="M",3,0)'


def main():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "nested-if"

    ws["A1"] = "输入"
    for col, head in zip("BCDE", ["3层(无缓存)", "3层(注入缓存)", "2层(对照)", "1层(对照)"]):
        ws[f"{col}1"] = head
    for col in "ABCDE":
        ws[f"{col}1"].font = openpyxl.styles.Font(bold=True)

    # 行 2: A=M(命中第 1 层 else 内的嵌套分支) 行 3: A=S 行 4: A=L
    for r, mark in ((2, "M"), (3, "S"), (4, "L")):
        ws[f"A{r}"] = mark
        ws[f"B{r}"] = NESTED3.format(r=r)
        ws[f"C{r}"] = NESTED3.format(r=r)
        ws[f"D{r}"] = NESTED2.format(r=r)
        ws[f"E{r}"] = NESTED1.format(r=r)

    for col, width in zip("ABCDE", [8, 14, 16, 12, 12]):
        ws.column_dimensions[col].width = width

    wb.save(TMP)

    # 向 C 列注入与公式一致的缓存值: M->3, S->1, L->5; 并去掉 t="str" 使缓存为数值类型(与 Excel 保存一致)
    cached = {"C2": 3, "C3": 1, "C4": 5}

    def inject(xml: str) -> str:
        for ref, value in cached.items():
            pat = re.compile(r'(<c r="%s"[^>]*>)(<f>[^<]*</f>)(?:<v>[^<]*</v>)?(</c>)' % ref)

            def repl(m, value=value):
                # 去掉 t="str", 使缓存值呈数值类型(与 Excel 保存的 <c r="C2"><f>..</f><v>3</v></c> 一致)
                c_open = m.group(1).replace(' t="str"', "")
                return f"{c_open}{m.group(2)}<v>{value}</v>{m.group(3)}"

            xml, n = pat.subn(repl, xml)
            if n != 1:
                raise RuntimeError(f"公式单元格 {ref} 注入缓存值失败(匹配 {n} 次)")
        return xml

    with zipfile.ZipFile(TMP) as zin:
        items = [(info, zin.read(info.filename)) for info in zin.infolist()]
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
        for info, data in items:
            if info.filename == "xl/worksheets/sheet1.xml":
                data = inject(data.decode("utf-8")).encode("utf-8")
            zout.writestr(info, data)
    os.remove(TMP)
    print("生成:", OUT)
    print("B 列 3 层嵌套无缓存(核心复现), C 列注入缓存值:", cached)


if __name__ == "__main__":
    main()
