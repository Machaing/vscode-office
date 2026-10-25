# -*- coding: utf-8 -*-
"""生成 plan-word-open-error 复现数据(两类 Word 打开失败)

产物一: test-word-open-hyperlink-toc.docx
  现象: 打开即弹 "Something went wrong / Error: Cannot read properties of
  undefined (reading 'filter')",查看器不可用。
  要点是目录条目采用「HYPERLINK 域代码内嵌 PAGEREF 域」的双层复杂域
  (fldChar begin/separate/end),而非 issue-597 复现文件的 <w:hyperlink> 元素形式。
  597 补丁后的域解析会把内层 PAGEREF 域以内层 complexField 形式并入外层
  HYPERLINK 域的 fieldResult;而 docx-editor-core 的 ProseMirror 转换期
  可见性检测函数 V 对 fieldResult 展开后的非 run 元素一律取 children.filter,
  complexField 没有 children 字段,于是抛 TypeError。取材自用户实测文档
  xxxplan-1.docx(WPS 生成,14MB,含 Visio 嵌入/EMF 媒体,媒体与本问题无关)。

产物二: test-word-open-doc-as-docx.docx
  现象: 弹库内英文面板 "Failed to Load Document / Failed to parse DOCX:
  Can't find end of central directory : is this a zip file ?"。
  文件头是 OLE2 复合文档(D0 CF 11 E0),偏移 0x08 的 CLSID 为
  00020906-0000-0000-C000-000000000046(Word.Document.8,即 Word 97-2003
  二进制 .doc),扩展名却是 .docx —— 名不符实的 .doc 冒名文件,JSZip 必然
  找不到 zip 中央目录。取材自用户实测文档 xxxplan-2.docx(9.9MB 真实 .doc,
  无法脚本再生,此处构造同特征的 4KB 最小 OLE2 头部)。
"""
import os
import struct
import sys
import zipfile

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "word")

W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

# 与真实文档一致的条目结构: HYPERLINK 域(separate 后为显示结果)内嵌 PAGEREF 域
TOC_ENTRY = (
    '<w:p><w:pPr><w:pStyle w:val="TOC1"/>'
    '<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9062"/></w:tabs></w:pPr>'
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
    '<w:r><w:instrText xml:space="preserve"> HYPERLINK \\l "_Toc100" </w:instrText></w:r>'
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
    '<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:noProof/></w:rPr><w:t>1.1 测试标题</w:t></w:r>'
    '<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:tab/></w:r>'
    '<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
    '<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr>'
    '<w:instrText xml:space="preserve"> PAGEREF _Toc100 \\h </w:instrText></w:r>'
    '<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>'
    '<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:t>1</w:t></w:r>'
    '<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
    '</w:p>'
)

DOCUMENT_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    f'<w:document {W_NS}>'
    '<w:body>'
    # 目录: sdt 容器内一行自含 HYPERLINK 域条目(与真实文档的 blockSdt 结构一致,
    # 条目段落 content 的顶层元素即 HYPERLINK complexField, 不依赖跨段 TOC 域)
    '<w:sdt><w:sdtPr><w:docPartObj>'
    '<w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/>'
    '</w:docPartObj></w:sdtPr>'
    '<w:sdtContent>'
    '<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>目录</w:t></w:r></w:p>'
    + TOC_ENTRY +
    '</w:sdtContent></w:sdt>'
    # 正文标题(带书签, 供 PAGEREF 引用)
    '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>'
    '<w:bookmarkStart w:id="0" w:name="_Toc100"/>'
    '<w:r><w:t>1.1 测试标题</w:t></w:r>'
    '<w:bookmarkEnd w:id="0"/></w:p>'
    '<w:p><w:r><w:t>正文内容。</w:t></w:r></w:p>'
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    '<w:pgMar w:top="1701" w:right="1418" w:bottom="1418" w:left="1418"/>'
    '<w:cols w:space="425" w:num="1"/></w:sectPr>'
    '</w:body></w:document>'
)

STYLES_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    f'<w:styles {W_NS}>'
    '<w:docDefaults><w:rPrDefault><w:rPr>'
    '<w:rFonts w:ascii="Calibri" w:eastAsia="宋体" w:hAnsi="Calibri"/>'
    '<w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults>'
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/>'
    '<w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style>'
    '<w:style w:type="paragraph" w:styleId="TOCHeading"><w:name w:val="TOC Heading"/>'
    '<w:basedOn w:val="Normal"/></w:style>'
    '<w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/>'
    '<w:basedOn w:val="Normal"/></w:style>'
    '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/>'
    '<w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>'
    '</w:styles>'
)

CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" ContentType='
    '"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    '<Override PartName="/word/styles.xml" ContentType='
    '"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    '</Types>'
)

ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
    'relationships/officeDocument" Target="word/document.xml"/>'
    '</Relationships>'
)

DOC_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
    'relationships/styles" Target="styles.xml"/>'
    '</Relationships>'
)


def build_hyperlink_toc_docx():
    """产物一: HYPERLINK 域代码形式目录的最小 docx"""
    path = os.path.join(OUT_DIR, "test-word-open-hyperlink-toc.docx")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", CONTENT_TYPES)
        zf.writestr("_rels/.rels", ROOT_RELS)
        zf.writestr("word/document.xml", DOCUMENT_XML)
        zf.writestr("word/_rels/document.xml.rels", DOC_RELS)
        zf.writestr("word/styles.xml", STYLES_XML)
    print(f"written: {path} ({os.path.getsize(path)} bytes)")


# OLE2 复合文档头(参考 MS-CFB): 签名 + Word.Document.8 CLSID + 头部字段 + 扇区填充
OLE_SIGNATURE = bytes.fromhex("D0CF11E0A1B11AE1")
WORD_CLSID = bytes.fromhex("0609 0200 0000 0000 C000 0000 0000 0046".replace(" ", ""))


def build_doc_as_docx():
    """产物二: 内容为 OLE2 头(.doc 特征)、扩展名为 .docx 的冒名文件"""
    path = os.path.join(OUT_DIR, "test-word-open-doc-as-docx.docx")
    header = OLE_SIGNATURE + WORD_CLSID + struct.pack(
        "<HHHHH", 0x003E, 0x0003, 0xFFFE, 0x0009, 0x0006
    )
    header += struct.pack("<IIII", 0, 0, 0, 0)  # 目录扇区数等,置 0 即可
    # 填充至 4KB, 模拟真实 .doc 的体量下限(JSZip 在前 64KB 内找不到 EOCD)
    data = header + b"\x00" * (4096 - len(header))
    with open(path, "wb") as f:
        f.write(data)
    print(f"written: {path} ({len(data)} bytes)")


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    build_hyperlink_toc_docx()
    build_doc_as_docx()
