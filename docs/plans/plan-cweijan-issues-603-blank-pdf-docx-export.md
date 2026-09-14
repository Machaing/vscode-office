# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/603](https://github.com/cweijan/vscode-office/issues/603)

## 标题

[BUG] Only outputting blank PDFs and DOCs now!

## 标签

bug

## 问题描述

- 环境: Windows 11,Extension Version 4.2.0(报告人 rascloud9,2026-09-08 提交);
- 现象: 从 markdown 导出时只写出文件的外层包装,内容全部丢失,三种导出格式同样为空:

| 输出格式 | 文件大小 | 实际内容 |
| --- | --- | --- |
| PDF | 988 字节 | 一张空白 A4 页,无文字、无图片 |
| HTML | 49,969 字节 | 6 个 CSS 主题块,去掉 CSS 后可见内容仅 `</div>` |
| DOCX | 18,609 字节 | document.xml 仅 1,108 字节,无段落、无表格 |

- 即导出管线本身未失败(文件成功写出),但正文内容未进入产物;
- issue 无评论,维护者尚未回复。

## 期望行为

导出的 PDF / HTML / DOCX 包含文档全部内容(标题、表格、公式、文本等)。

## 实际行为

三种格式的导出产物均为只有外壳的空白文件。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-603-blank-pdf-docx-export.md`
生成脚本: 文本文件,直接维护

文件内容说明: 构造一份常规 markdown 文档(多级标题、段落、列表、表格、行内与块级公式),
内容在预览中应可正常渲染,用于验证导出产物是否为空白外壳,与 issue 现象对应。

### 复现步骤

1. F5 调起扩展调试,打开复现文件(预览应正常显示全部内容);
2. 依次执行导出 PDF、导出 DOCX(如有导出 HTML 一并执行),等待产物生成;
3. 打开导出产物检查: 预期: PDF/DOCX 含全部内容;实际: 产物为空白
   (PDF 仅一张空白 A4 页、DOCX 的 document.xml 无段落无表格,见 issue 描述的体积特征)。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
