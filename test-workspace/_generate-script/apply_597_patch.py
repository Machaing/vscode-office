# -*- coding: utf-8 -*-
"""对 pnpm patch 目录中的 docx-editor-core 应用 issue-597 修复补丁

修复: 域状态机 q() 增加嵌套域栈支持 —— 嵌套 begin 不再清空外层域累积,
嵌套 end 将内层 complexField 并入外层 fieldResult; 段末未闭合的域摊平其
fieldResult 避免跨段域(TOC)内容丢失。
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")

FILES = [
    r"node_modules/.pnpm_patches/@eigenpal/docx-editor-core@1.9.0/dist/chunk-TNQDZQ6K.mjs",
    r"node_modules/.pnpm_patches/@eigenpal/docx-editor-core@1.9.0/dist/chunk-OPJSWATH.js",
]


def patch(path, B):
    data = open(path, encoding="utf-8").read()
    orig = data

    # 1. 声明行: 增加 fldStack
    old = f"false,{B}=false,y;for(let T of c){{let A=oe(T.name);"
    new = f"false,{B}=false,y,fldStack=[];for(let T of c){{let A=oe(T.name);"
    assert data.count(old) == 1, f"decl anchor not unique: {path}"
    data = data.replace(old, new)

    # 2. begin: 嵌套时先保存外层状态
    old = f'if(g&&(u=true,C=false,d="",p=[],w=[],h=false,{B}=false,y=M.formatting),u){{'
    new = (f'if(g){{if(u){{fldStack.push({{d:d,C:C,p:p,w:w,y:y,h:h,B:{B}}});}}'
           f'u=true;C=false;d="";p=[];w=[];h=false;{B}=false;y=M.formatting;}}if(u){{')
    assert data.count(old) == 1, f"begin anchor not unique: {path}"
    data = data.replace(old, new)

    # 3. end: 嵌套闭合时恢复外层状态并将内层域并入外层 fieldResult
    old = f"{B}&&(E.dirty=true),l.push(E),u=false;}}"
    new = (f"{B}&&(E.dirty=true);"
           f"if(fldStack.length){{let O=fldStack.pop();w=O.w;w.push(E);p=O.p;d=O.d;C=O.C;y=O.y;h=O.h;{B}=O.B;}}"
           f"else{{l.push(E);u=false;}}}}")
    assert data.count(old) == 1, f"end anchor not unique: {path}"
    data = data.replace(old, new)

    # 4. 段末未闭合域: 摊平 fieldResult(跨段 TOC 域的条目文本不丢失)
    old = 'ommlXml:M,plainText:g||void 0};l.push(F);break}}}return l}'
    new = ('ommlXml:M,plainText:g||void 0};l.push(F);break}}}'
           'if(u){for(let O of w)l.push(O);while(fldStack.length){let O=fldStack.pop();for(let S of O.w)l.push(S);}}'
           'return l}')
    assert data.count(old) == 1, f"return anchor not unique: {path}"
    data = data.replace(old, new)

    open(path, "w", encoding="utf-8", newline="").write(data)
    print(f"patched {path} ({len(orig)} -> {len(data)} bytes)")


patch(FILES[0], "b$1")
patch(FILES[1], "b")
print("done")
