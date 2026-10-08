# -*- coding: utf-8 -*-
"""生成 Office Viewer 测试文档(Python 部分): Excel/Word/PPT/图片类"""
import io
import os
import struct
import sys
import zipfile
import zlib

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

COLORS = [(66, 133, 244), (219, 68, 55), (244, 180, 0), (15, 157, 88), (171, 71, 188)]


def make_image(label, size=128):
    """生成带渐变背景+几何图形+文字的测试图"""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    # 垂直渐变
    c1, c2 = COLORS[0], COLORS[3]
    for y in range(size):
        t = y / size
        draw.line([(0, y), (size, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(c1, c2)))
    # 同心圆
    for i, c in enumerate(reversed(COLORS)):
        r = size // 2 - i * 12
        if r > 0:
            draw.ellipse([size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r], outline=c, width=4)
    # 对角线
    draw.line([(0, 0), (size, size)], fill=(255, 255, 255), width=3)
    draw.line([(size, 0), (0, size)], fill=(0, 0, 0), width=3)
    # 标签
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    draw.rectangle([4, 4, bbox[2] + 10, bbox[3] + 10], fill=(255, 255, 255))
    draw.text((7, 5), label, fill=(0, 0, 0), font=font)
    return img


def gen_excel():
    import openpyxl
    from openpyxl.chart import BarChart, Reference
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "销售数据"
    headers = ["月份", "产品A", "产品B", "产品C", "合计", "占比"]
    rows = [
        ["一月", 1200, 980, 1560, None, None],
        ["二月", 1350, 1120, 1490, None, None],
        ["三月", 1580, 1260, 1720, None, None],
        ["四月", 1490, 1180, 1680, None, None],
        ["五月", 1720, 1350, 1890, None, None],
    ]
    ws.append(headers)
    for r in rows:
        ws.append(r)

    header_fill = PatternFill("solid", fgColor="4472C4")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    thin = Side(style="thin", color="999999")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
    for row in ws.iter_rows(min_row=2, max_row=6, min_col=1, max_col=6):
        for cell in row:
            cell.border = border
            if cell.column >= 2:
                cell.alignment = Alignment(horizontal="right")
    for r in range(2, 7):
        ws.cell(row=r, column=5).value = f"=SUM(B{r}:D{r})"
        ws.cell(row=r, column=6).value = f"=TEXT(E{r}/$E$7,\"0.0%\")"
        for c in range(2, 5):
            ws.cell(row=r, column=c).number_format = "#,##0"
    ws.append(["合计", "=SUM(B2:B6)", "=SUM(C2:C6)", "=SUM(D2:D6)", "=SUM(E2:E6)", ""])
    ws["A7"].font = Font(bold=True)
    ws.merge_cells("A9:F9")
    ws["A9"] = "Office Viewer Excel 测试文件 (公式/样式/图表/冻结窗格)"
    ws["A9"].alignment = Alignment(horizontal="center")
    ws["A9"].fill = PatternFill("solid", fgColor="FFF2CC")
    for col, width in zip("ABCDEF", [12, 10, 10, 10, 12, 10]):
        ws.column_dimensions[col].width = width
    ws.freeze_panes = "A2"

    chart = BarChart()
    chart.title = "月度销量"
    chart.height, chart.width = 8, 16
    data = Reference(ws, min_col=2, max_col=4, min_row=1, max_row=6)
    cats = Reference(ws, min_col=1, min_row=2, max_row=6)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(cats)
    ws.add_chart(chart, "H2")

    ws2 = wb.create_sheet("说明")
    ws2["A1"] = "第二个工作表"
    ws2["A2"] = "用于测试多 Sheet 切换"

    d = os.path.join(ROOT, "excel")
    os.makedirs(d, exist_ok=True)
    wb.save(os.path.join(d, "sample.xlsx"))
    # xlsm: openpyxl 无 VBA 源, 以合法 xlsx 包结构保存为 xlsm(查看器按 zip 解析)
    wb.save(os.path.join(d, "sample.xlsm"))
    print("excel: xlsx/xlsm ok")


def convert_content_type(src, dst, old, new):
    """复制 OOXML 包并替换 [Content_Types].xml 中的主文档类型"""
    with zipfile.ZipFile(src) as zin:
        items = [(i, zin.read(i.filename)) for i in zin.infolist()]
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
        for info, data in items:
            if info.filename == "[Content_Types].xml":
                data = data.replace(old.encode(), new.encode())
            zout.writestr(info, data)


def gen_word():
    from docx import Document
    from docx.shared import Cm, Pt, RGBColor

    doc = Document()
    doc.add_heading("Office Viewer Word 测试文档", 0)
    doc.add_heading("1. 段落与样式", level=1)
    p = doc.add_paragraph("这是一段中英文混排的正文 Hello World,用于测试 docx 渲染。")
    p.add_run(" 粗体文字").bold = True
    p.add_run(" 斜体文字").italic = True
    p.add_run(" 彩色文字").font.color.rgb = RGBColor(0xCC, 0x00, 0x00)
    doc.add_heading("2. 列表", level=1)
    for i, item in enumerate(["无序列表项一", "无序列表项二", "无序列表项三"], 1):
        doc.add_paragraph(item, style="List Bullet")
        doc.add_paragraph(f"有序列表项 {i}", style="List Number")
    doc.add_heading("3. 表格", level=1)
    table = doc.add_table(rows=3, cols=3)
    table.style = "Light Grid Accent 1"
    for r in range(3):
        for c in range(3):
            table.cell(r, c).text = f"单元格 {r + 1}-{c + 1}"
    doc.add_heading("4. 引用", level=1)
    doc.add_paragraph("这是一段引用文字。", style="Intense Quote")

    d = os.path.join(ROOT, "word")
    os.makedirs(d, exist_ok=True)
    docx_path = os.path.join(d, "sample.docx")
    doc.save(docx_path)
    convert_content_type(
        docx_path, os.path.join(d, "sample.dotx"),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml')
    print("word: docx/dotx ok")


def gen_ppt():
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.util import Pt

    prs = Presentation()
    slide1 = prs.slides.add_slide(prs.slide_layouts[0])
    slide1.shapes.title.text = "Office Viewer PPT 测试"
    sub = slide1.placeholders[1]
    sub.text = "标题页: pptx 格式渲染测试"
    slide2 = prs.slides.add_slide(prs.slide_layouts[1])
    slide2.shapes.title.text = "内容页"
    body = slide2.placeholders[1].text_frame
    body.text = "第一点:项目符号列表"
    for text in ["第二点:中英文混排 Mixed Text", "第三点:样式与排版"]:
        para = body.add_paragraph()
        para.text = text
        para.level = 1
    slide3 = prs.slides.add_slide(prs.slide_layouts[5])
    slide3.shapes.title.text = "第三页"
    box = slide3.shapes.add_textbox(Pt(60), Pt(150), Pt(500), Pt(60))
    para = box.text_frame.paragraphs[0]
    run = para.add_run()
    run.text = "彩色加粗文本 Colored Bold"
    run.font.bold = True
    run.font.size = Pt(28)
    run.font.color.rgb = RGBColor(0xDD, 0x44, 0x00)

    d = os.path.join(ROOT, "powerpoint")
    os.makedirs(d, exist_ok=True)
    pptx_path = os.path.join(d, "sample.pptx")
    prs.save(pptx_path)
    convert_content_type(
        pptx_path, os.path.join(d, "sample.pptm"),
        'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml')
    print("powerpoint: pptx/pptm ok")


def gen_images():
    from PIL import Image

    d = os.path.join(ROOT, "image")
    os.makedirs(d, exist_ok=True)
    img = make_image("PNG")
    img.save(os.path.join(d, "sample.png"))
    img.save(os.path.join(d, "sample.jpg"), quality=90)
    img.save(os.path.join(d, "sample.jpeg"), quality=90)
    img.save(os.path.join(d, "sample.bmp"))
    img.save(os.path.join(d, "sample.webp"), quality=90)
    img.save(os.path.join(d, "sample.ico"), sizes=[(16, 16), (32, 32), (48, 48), (128, 128)])

    # 动画 GIF: 5 帧纯色序列
    frames = []
    for c in COLORS:
        frame = Image.new("RGB", (64, 64), c)
        frames.append(frame)
    frames[0].save(os.path.join(d, "sample.gif"), save_all=True, append_images=frames[1:],
                   duration=300, loop=0)

    # CUR: 手工构造 (header + entry + 32bpp BMP 数据), PIL 的 CUR 插件只认 BMP
    small = img.resize((32, 32)).convert("RGBA")
    rows = [small.tobytes()[y * 128:(y + 1) * 128] for y in range(32)]  # RGBA 行
    xor = b"".join(
        bytes(b for px in range(32) for b in (row[px * 4 + 2], row[px * 4 + 1], row[px * 4], 255))  # BGRA
        for row in reversed(rows))                                                   # 自底向上
    and_mask = b"\x00" * (4 * 32)
    bmp = struct.pack("<IiiHHIIiiII", 40, 32, 64, 1, 32, 0, len(xor) + len(and_mask), 0, 0, 0, 0) + xor + and_mask
    cur = bytearray()
    cur += struct.pack("<HHH", 0, 2, 1)                                # reserved, type=2(cursor), count
    cur += struct.pack("<BBBBHHII", 32, 32, 0, 0, 16, 16, len(bmp), 22)  # entry, 热点 (16,16)
    cur += bmp
    with open(os.path.join(d, "sample.cur"), "wb") as f:
        f.write(cur)

    # APNG: 手工构造(Pillow 不支持写), 2 帧纯色
    with open(os.path.join(d, "sample.apng"), "wb") as f:
        f.write(build_apng())
    print("image: png/jpg/jpeg/bmp/webp/ico/gif/cur/apng ok")


def png_chunk(ctype: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + ctype + data + struct.pack(">I", zlib.crc32(ctype + data) & 0xFFFFFFFF)


def png_frame(width: int, height: int, rgb: tuple) -> bytes:
    """构造一帧未过滤的 RGB 扫描线并 zlib 压缩"""
    row = b"\x00" + bytes(rgb) * width
    return zlib.compress(row * height, 9)


def build_apng() -> bytes:
    w = h = 64
    out = bytearray(b"\x89PNG\r\n\x1a\n")
    out += png_chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    out += png_chunk(b"acTL", struct.pack(">II", 2, 0))  # 2 帧, 无限循环

    def fctl(seq):
        return struct.pack(">IIIIIHHBB", seq, w, h, 0, 0, 15, 100, 0, 0)

    out += png_chunk(b"fcTL", fctl(0))
    out += png_chunk(b"IDAT", png_frame(w, h, COLORS[0]))
    out += png_chunk(b"fcTL", fctl(1))
    out += png_chunk(b"fdAT", struct.pack(">I", 2) + png_frame(w, h, COLORS[3]))
    out += png_chunk(b"IEND", b"")
    return bytes(out)


def gen_tiff():
    from PIL import Image
    d = os.path.join(ROOT, "tiff")
    os.makedirs(d, exist_ok=True)
    make_image("TIFF").save(os.path.join(d, "sample.tif"))
    # 多页 TIFF
    pages = [Image.new("RGB", (64, 64), c) for c in COLORS[:3]]
    pages[0].save(os.path.join(d, "sample.tiff"), save_all=True, append_images=pages[1:])
    print("tiff: tif/tiff ok")


def gen_icns():
    d = os.path.join(ROOT, "icns")
    os.makedirs(d, exist_ok=True)
    chunks = b""
    for size, ctype in [(128, b"ic07"), (256, b"ic08")]:
        png = io.BytesIO()
        make_image(f"{size}", size=size).save(png, format="png")
        data = png.getvalue()
        chunks += ctype + struct.pack(">I", len(data) + 8) + data
    with open(os.path.join(d, "sample.icns"), "wb") as f:
        f.write(b"icns" + struct.pack(">I", len(chunks) + 8) + chunks)
    print("icns ok")


def gen_java_class():
    """从 java-decompiler.jar 提取 class 文件"""
    d = os.path.join(ROOT, "java")
    os.makedirs(d, exist_ok=True)
    jar = os.path.join(os.path.dirname(ROOT), "resource", "java-decompiler.jar")
    targets = {
        "org/jetbrains/java/decompiler/IdeaDecompiler.class": "IdeaDecompiler.class",
        "org/jetbrains/java/decompiler/code/CodeConstants.class": "CodeConstants.class",
    }
    with zipfile.ZipFile(jar) as z:
        for src, name in targets.items():
            with open(os.path.join(d, name), "wb") as f:
                f.write(z.read(src))
    print("java: class ok")


if __name__ == "__main__":
    gen_excel()
    gen_word()
    gen_ppt()
    gen_images()
    gen_tiff()
    gen_icns()
    gen_java_class()
    print("python 部分全部完成")
