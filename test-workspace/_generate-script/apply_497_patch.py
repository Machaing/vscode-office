# -*- coding: utf-8 -*-
"""对 pnpm patch 目录中的 docx-editor-core 应用 issue-497 修复补丁

修复: 表格分片函数 Kt(layoutTable)的行拆分决策 —— 原逻辑在行放不下当前页时,
调用 Ee() 在行内找一个拆分点把行从中间切开(上半留在本页底部、下半作为
topClip 续行到下页, 续行的序号/名称等单元格为空), 视觉上"跨页表格显示不完整"。

改为: 当本页分片已放过至少一行(w>P)时不拆分(x=0), 整行顺延到下一页
(ensureFits 保证下页空间), 符合 Word 惯例; 仅当行是分片首行(w===P,
即行高超过整页可用高度)时保留 Ee 行内拆分, 避免超高行内容丢失。
cantSplit 行为保持不变。

与 issue-597 补丁(域状态机 fldStack, chunk-TNQDZQ6K.mjs / chunk-OPJSWATH.js)
作用于不同文件, 可共存。
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

PATCH_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "node_modules", ".pnpm_patches",
    "@eigenpal", "docx-editor-core@1.9.0", "dist",
)
FILES = ["chunk-L7HQCG64.mjs", "chunk-LNHPDJCA.js"]

OLD = "let p=S-B,x=e.rows[T]?.cantSplit?0:Ee(s,T,v,p);"
NEW = "let p=S-B,x=w>P?0:e.rows[T]?.cantSplit?0:Ee(s,T,v,p);"


def patch(path):
    data = open(path, encoding="utf-8").read()
    if NEW in data:
        print(f"already patched: {path}")
        return
    assert data.count(OLD) == 1, f"anchor not unique in {path}: {data.count(OLD)}"
    data = data.replace(OLD, NEW)
    open(path, "w", encoding="utf-8", newline="").write(data)
    print(f"patched {path}")


def main():
    for name in FILES:
        patch(os.path.normpath(os.path.join(PATCH_DIR, name)))
    print("done")


if __name__ == "__main__":
    main()
