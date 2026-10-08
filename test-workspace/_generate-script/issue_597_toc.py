# -*- coding: utf-8 -*-
"""生成 issue-597 复现数据: 带 Word 自动目录(TOC 域)的 docx

issue 现象: Word 中目录完整, 插件预览时目录条目文本/编号丢失, 仅剩页码。
复现要点是还原 Word 真实生成的 TOC 结构:
- sdt 容器(docPartGallery="Table of Contents")
- TOC 域 fldChar begin/separate/end + instrText " TOC \\o \"1-3\" \\h \\z \\u "
- 条目 = hyperlink(anchor=_TocX) 包含 rStyle Hyperlink 文本 run + webHidden tab
  + 嵌套 PAGEREF 域(begin/instrText/separate/页码文本/end)
- 正文标题段落内 bookmarkStart/_TocX/bookmarkEnd
- styles.xml 注入 TOCHeading/TOC1/TOC2/Hyperlink 样式
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_BREAK
from docx.oxml import parse_xml
from docx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "word", "issue-597-toc.docx")

TAB_POS = "9350"  # letter 页宽 12240 - 左右边距 1440*2, 右对齐制表位


def style_xml(style_id, name, based_on="Normal", kind="paragraph", extra=""):
    return (
        f'<w:style xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
        f' w:type="{kind}" w:styleId="{style_id}">'
        f'<w:name w:val="{name}"/><w:basedOn w:val="{based_on}"/>'
        f'<w:uiPriority w:val="39"/><w:unhideWhenUsed/>{extra}</w:style>'
    )


def inject_toc_styles(doc):
    styles = [
        style_xml("TOCHeading", "TOC Heading", extra=(
            '<w:pPr><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="9"/></w:pPr>'
            '<w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia"/>'
            '<w:b/><w:bCs/><w:color w:val="2F5496"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>')),
        style_xml("TOC1", "toc 1", extra=(
            f'<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="{TAB_POS}"/></w:tabs>'
            '<w:spacing w:after="100"/></w:pPr>')),
        style_xml("TOC2", "toc 2", extra=(
            f'<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="{TAB_POS}"/></w:tabs>'
            '<w:ind w:left="220"/><w:spacing w:after="100"/></w:pPr>')),
        style_xml("Hyperlink", "Hyperlink", kind="character", extra=(
            '<w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>')),
    ]
    styles_el = doc.styles.element
    for s in styles:
        styles_el.append(parse_xml(s))


def toc_entry(anchor, text, page, toc_style, first=False, last=False):
    """单条目录条目段落; first 时携带 TOC 域 begin/separate, last 时携带 end"""
    runs = []
    if first:
        runs.append('<w:r><w:fldChar w:fldCharType="begin"/></w:r>')
        runs.append('<w:r><w:instrText xml:space="preserve"> TOC \\o &quot;1-3&quot; \\h \\z \\u </w:instrText></w:r>')
        runs.append('<w:r><w:fldChar w:fldCharType="separate"/></w:r>')
    runs.append(
        f'<w:hyperlink w:anchor="{anchor}" w:history="1">'
        f'<w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:noProof/></w:rPr><w:t xml:space="preserve">{text}</w:t></w:r>'
        f'<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:tab/></w:r>'
        f'<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
        f'<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:instrText xml:space="preserve"> PAGEREF {anchor} \\h </w:instrText></w:r>'
        f'<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>'
        f'<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:t>{page}</w:t></w:r>'
        f'<w:r><w:rPr><w:noProof/><w:webHidden/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
        f'</w:hyperlink>')
    if last:
        runs.append('<w:r><w:rPr><w:b/><w:bCs/><w:noProof/></w:rPr><w:tab/></w:r>')
        runs.append('<w:r><w:rPr><w:b/><w:bCs/><w:noProof/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>')
    return (
        f'<w:p><w:pPr><w:pStyle w:val="{toc_style}"/>'
        f'<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="{TAB_POS}"/></w:tabs>'
        f'<w:rPr><w:noProof/></w:rPr></w:pPr>{"".join(runs)}</w:p>')


def build_toc_sdt(entries):
    paras = [
        '<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr>'
        '<w:r><w:t>目录</w:t></w:r></w:p>',
    ]
    for i, (anchor, text, page, style) in enumerate(entries):
        paras.append(toc_entry(anchor, text, page, style,
                               first=(i == 0), last=(i == len(entries) - 1)))
    return (
        '<w:sdt xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:sdtPr><w:id w:val="-1000000001"/>'
        '<w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj>'
        '</w:sdtPr><w:sdtEndPr/>'
        f'<w:sdtContent>{"".join(paras)}</w:sdtContent></w:sdt>')


def add_heading_with_bookmark(doc, text, level, bookmark_id, bookmark_name):
    p = doc.add_heading(text, level=level)
    start = parse_xml(
        f'<w:bookmarkStart xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
        f' w:id="{bookmark_id}" w:name="{bookmark_name}"/>')
    end = parse_xml(
        f'<w:bookmarkEnd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
        f' w:id="{bookmark_id}"/>')
    p._p.insert(1, start)  # pPr 之后
    p._p.append(end)
    return p


def main():
    doc = Document()
    inject_toc_styles(doc)

    # 目录条目: (书签, 文本, 页码, 样式)
    entries = [
        ("_Toc10001", "第一章 引言", "1", "TOC1"),
        ("_Toc10002", "第二章 系统设计", "2", "TOC1"),
        ("_Toc10003", "2.1 总体架构", "2", "TOC2"),
        ("_Toc10004", "2.2 数据流", "2", "TOC2"),
        ("_Toc10005", "第三章 总结", "3", "TOC1"),
    ]
    toc = parse_xml(build_toc_sdt(entries))
    body = doc.element.body
    body.insert(0, toc)

    # 正文: 每章分页, 标题挂书签
    add_heading_with_bookmark(doc, "第一章 引言", 1, 100, "_Toc10001")
    doc.add_paragraph("这是第一章正文。Word 中该文档目录完整, 插件预览时目录条目文本丢失, 仅剩页码。")
    doc.paragraphs[-1].runs[0].add_break(WD_BREAK.PAGE)

    add_heading_with_bookmark(doc, "第二章 系统设计", 1, 101, "_Toc10002")
    doc.add_paragraph("第二章一级标题正文。")
    add_heading_with_bookmark(doc, "2.1 总体架构", 2, 102, "_Toc10003")
    doc.add_paragraph("2.1 节正文。")
    add_heading_with_bookmark(doc, "2.2 数据流", 2, 103, "_Toc10004")
    doc.add_paragraph("2.2 节正文。")
    doc.paragraphs[-1].runs[0].add_break(WD_BREAK.PAGE)

    add_heading_with_bookmark(doc, "第三章 总结", 1, 104, "_Toc10005")
    doc.add_paragraph("第三章正文, 用于确认非目录区域渲染正常。")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc.save(OUT)
    print("生成:", OUT)


if __name__ == "__main__":
    main()
