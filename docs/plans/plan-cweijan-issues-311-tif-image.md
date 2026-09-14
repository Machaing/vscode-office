# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/311](https://github.com/cweijan/vscode-office/issues/311)

## 标题

[BUG] Word 中的 .tif 格式图片无法预览

## 标签

bug

## 问题描述

提交者 changlichun,2024-04-28。

环境:

- OS: Windows 10
- Extension Version: v3.3.2

正文极简,仅填写环境信息并附一张截图(截图内容无法从 issue 页面提取,按标题推断为 Word 预览中 .tif 图片位置空白/不渲染)。未提供复现步骤、期望行为、实际行为等结构化描述,无上传文件。

截至抓取时无任何评论,无维护者回复。

## 期望行为

`.docx` 中内嵌的 TIFF 图片在预览时与 PNG/JPEG 等格式一样正常渲染(推断,正文未明写)。

## 实际行为

Word 文档中的 .tif 格式图片无法预览(标题及截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/word/test-word-cweijan-311-tif-image.docx`
生成脚本: `test-workspace/_generate/issue_311_tif_image.py`

文件内容说明: 用 Pillow 生成同一张测试图(渐变背景 + 同心圆),分别以 PNG(对照组)与 TIFF(RGB 基线、未压缩)内嵌到同一 docx 的两个章节中。Word/WPS 打开两张图均应可见;查看器缺陷仅影响 TIFF 那张时即可对照确认问题范围。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 查看「1. PNG 图片(对照组)」与「2. TIFF 图片(复现组)」两张图;
3. 预期: PNG 与 TIFF 均正常显示;实际: TIFF 区域空白/不渲染,PNG 正常。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
