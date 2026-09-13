# Office Viewer Enhance

[English](README.md) | 简体中文 | [繁體中文](README-TW.md)

## 概述

**Office Viewer Enhance** 致力于提供比原仓库 **issue 响应更迅速、功能更强大** 的 VS Code 文件预览插件。本项目 fork 自 [cweijan/vscode-office（Office Viewer）](https://github.com/cweijan/vscode-office)，感谢原作者 [cweijan](https://github.com/cweijan) 建立并维护了如此出色的扩展；fork 后独立发布，让修复能更快交付，例如：

- Excel 中含绝对引用的公式（如 `=E6/$E$9`）显示为 `NaN%` 的问题——现在优先显示文件中缓存的计算结果，并正确支持 `$` 引用求值。
- Word 自动目录条目文本丢失、仅显示页码的问题（[上游 #597](https://github.com/cweijan/vscode-office/issues/597)）——本项目已修复。

上游 issue 在本项目的处理情况见 [docs/issues/cweijan-issues/ISSUES.md](docs/issues/cweijan-issues/ISSUES.md)。

如果本扩展对你有帮助，也欢迎给[原始项目](https://github.com/cweijan/vscode-office)点一个 ★。

## 介绍

本扩展支持在 VS Code 中直接预览与编辑以下常见办公与设计文件：

- Excel: `.xls`、`.xlsx`、`.xlsm`、`.csv`、`.ods`
- Word: `.docx`、`.dotx`
- PowerPoint: `.pptx`、`.pptm`
- PDF 与电子书: `.pdf`、`.epub`
- HEIC/TIFF: `.heic`、`.heif`、`.tiff`
- 设计文件: `.psd`、`.xmind`、`.icns`、`.svg`
- 字体: `.ttf`、`.otf`、`.woff`、`.woff2`
- Markdown: `.md`、`.markdown`
- HTML: `.html`、`.htm`
- HTTP 请求: `.http`、`.rest`
- Java: `.class`（反编译）
- 压缩文件: `.zip`、`.jar`、`.vsix`、`.rar`、`.7z`、`.tar`、`.tar.gz`、`.tgz`、`.apk`

## 常见使用问题

- [Markdown：默认使用 VS Code 原生编辑器](docs/faq/markdown-default-editor-CN.md)
- [Markdown：导出操作](docs/faq/markdown-export-CN.md)
- [Markdown 编辑器快捷键](docs/faq/markdown-shortcuts.md)

## 其他功能

- HTML: 编辑时按下 `Ctrl+Shift+V` 可实时预览
- YAML: 支持文档大纲与锚点导航（别名引用可跳转到定义）
- 图标主题: 内置 [Material Icon Theme](https://github.com/PKief/vscode-material-icon-theme) 部分图标，并提供 **Office Material Icon Theme** 与 **One Dark Modern** 配色主题
- Excel: 支持预览与保存 `.xlsx`、`.xls`、`.xlsm`、`.csv`、`.ods` 等文件
- HTTP: 在 `.http`、`.rest` 文件中发送请求（整合自 [REST Client](https://github.com/Huachao/vscode-restclient)，并修复了本地请求的已知问题）；按 `Ctrl+Enter` / `⌘ Enter` 发送
- Java: 打开 `.class` 文件可反编译并查看源码

## 开发指南

参阅 [docs/dev/development-CN.md](docs/dev/development-CN.md) 了解环境要求、调试、构建与发布。

## 隐私

本 Fork **不收集**任何使用数据或遥测信息，所有预览与编辑均在 VS Code 本地完成。

## Credits

- 上游项目: [cweijan/vscode-office](https://github.com/cweijan/vscode-office)（Office Viewer）——本 fork 基于此项目
- PDF rendering: [mozilla/pdf.js](https://github.com/mozilla/pdf.js/)
- DOCX rendering: [VolodymyrBaydalka/docxjs](https://github.com/VolodymyrBaydalka/docxjs)
- PPTX rendering: [pptxviewjs](https://www.npmjs.com/package/pptxviewjs)
- XLSX rendering:
  - [SheetJS/sheetjs](https://github.com/SheetJS/sheetjs): XLSX parsing
  - [myliang/x-spreadsheet](https://github.com/myliang/x-spreadsheet): XLSX rendering
- EPUB: [futurepress/epub.js](https://github.com/futurepress/epub.js)
- PSD: [ag-psd](https://github.com/Agamnentzar/ag-psd)
- XMind: [mind-elixir](https://github.com/ssshooter/mind-elixir-core), [@mind-elixir/import-xmind](https://github.com/ssshooter/mind-elixir-core)
- HEIC conversion: [heic2any](https://github.com/alexcorvi/heic2any)
- Java decompiler: [JetBrains/java-decompiler](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)
- HTTP: [REST Client](https://github.com/Huachao/vscode-restclient)
- Markdown: [Vanessa219/vditor](https://github.com/Vanessa219/vditor)
- Material Icon theme: [PKief/vscode-material-icon-theme](https://github.com/PKief/vscode-material-icon-theme)
