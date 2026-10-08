# -*- coding: utf-8 -*-
"""生成 issue-597 复现数据变体: TOC 域结果为普通文本 run(无 hyperlink 包裹)

Word/WPS 在 TOC 域不含 \\h 开关(或部分生成器)时, 目录条目是 TOC 域 fieldResult 内的
普通 run 序列: [begin][instr][separate][文本][tab][PAGEREF嵌套域...] ... [end]
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

from docx import Document
from docx.enum.text import WD_BREAK
from docx.oxml import parse_xml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "word", "issue-597-toc-plain.docx")

TAB_POS = "9350"

TOC_STYLES = (
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    '<w:style w:type="paragraph" w:styleId="TOCHeading"><w:name w:val="TOC Heading"/>'
    '<w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>'
    '<w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/>'
    f'<w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="{TAB_POS}"/></w:tabs></w:pPr></w:style>'
    '<w:style w:type="paragraph" w:styleId="TOC2"><w:name w:val="toc 2"/><w:basedOn w:val="Normal"/>'
    f'<w:pPr><w:ind w:left="220"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="{TAB_POS}"/></w:tabs></w:pPr></w:style>'
    '</w:styles>'
)


def r_text(t):
    return f'<w:r><w:t xml:space="preserve">{t}</w:t></w:r>'


def r_tab():
    return '<w:r><w:tab/></w:r>'


def r_field(char):
    return f'<w:r><w:fldChar w:fldCharType="{char}"/></w:r>'


def r_instr(instr):
    return f'<w:r><w:instrText xml:space="preserve"> {instr} </w:instrText></w:r>'


def pageref(anchor, page):
    """嵌套 PAGEREF 域: begin instr separate 页码 end"""
    return (r_field("begin") + r_instr(f'PAGEREF {anchor} \\h') + r_field("separate")
            + r_text(page) + r_field("end"))


def toc_paragraph(text, anchor, page, style, toc_begin=False, toc_end=False):
    parts = []
    if toc_begin:
        parts += [r_field("begin"), r_instr('TOC \\o "1-3" \\z \\u'), r_field("separate")]
    parts += [r_text(text), r_tab(), pageref(anchor, page)]
    if toc_end:
        parts += [r_tab(), r_field("end")]
    return f'<w:p><w:pPr><w:pStyle w:val="{style}"/></w:pPr>{"".join(parts)}</w:p>'


def main():
    doc = Document()

    entries = [
        ("_Toc20001", "第一章 引言", "1", "TOC1"),
        ("_Toc20002", "第二章 系统设计", "2", "TOC1"),
        ("_Toc20003", "2.1 总体架构", "2", "TOC2"),
        ("_Toc20004", "2.2 数据流", "2", "TOC2"),
        ("_Toc20005", "第三章 总结", "3", "TOC1"),
    ]
    paras = ['<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>目录</w:t></w:r></w:p>']
    for i, (anchor, text, page, style) in enumerate(entries):
        paras.append(toc_paragraph(text, anchor, page, style,
                                   toc_begin=(i == 0), toc_end=(i == len(entries) - 1)))
    toc_block = parse_xml(
        '<w:sdt xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr>'
        f'<w:sdtContent>{"".join(paras)}</w:sdtContent></w:sdt>')
    doc.element.body.insert(0, toc_block)
    # styles 一次性替换
    styles_el = doc.styles.element
    for st in parse_xml(TOC_STYLES):
        styles_el.append(st)

    def heading(text, level, name, bid):
        p = doc.add_heading(text, level=level)
        p._p.insert(1, parse_xml(
            f'<w:bookmarkStart xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:id="{bid}" w:name="{name}"/>'))
        p._p.append(parse_xml(
            f'<w:bookmarkEnd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:id="{bid}"/>'))

    heading("第一章 引言", 1, "_Toc20001", 200)
    doc.add_paragraph("第一章正文(变体: TOC 域结果为纯文本 run, 无 hyperlink)。")
    doc.paragraphs[-1].runs[0].add_break(WD_BREAK.PAGE)
    heading("第二章 系统设计", 1, "_Toc20002", 201)
    doc.add_paragraph("第二章正文。")
    heading("2.1 总体架构", 2, "_Toc20003", 202)
    doc.add_paragraph("2.1 正文。")
    heading("2.2 数据流", 2, "_Toc20004", 203)
    doc.add_paragraph("2.2 正文。")
    doc.paragraphs[-1].runs[0].add_break(WD_BREAK.PAGE)
    heading("第三章 总结", 1, "_Toc20005", 204)
    doc.add_paragraph("第三章正文。")

    doc.save(OUT)
    print("生成:", OUT)


if __name__ == "__main__":
    main()
