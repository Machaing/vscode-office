# Office Viewer Enhance

[English](README.md) | [简体中文](README-CN.md) | 繁體中文

## 概述

**Office Viewer Enhance** 致力於提供比原始儲存庫 **issue 回應更迅速、功能更強大** 的 VS Code 檔案預覽擴充功能。本專案 fork 自 [cweijan/vscode-office（Office Viewer）](https://github.com/cweijan/vscode-office)，感謝原作者 [cweijan](https://github.com/cweijan) 建立並維護了如此出色的擴充功能；fork 後獨立發佈，讓修復能更快交付，例如：

- Excel 中含絕對參照的公式（如 `=E6/$E$9`）顯示為 `NaN%` 的問題——現在優先顯示檔案中快取的計算結果，並正確支援 `$` 參照求值。
- Word 自動目錄條目文字丟失、僅顯示頁碼的問題（[上游 #597](https://github.com/cweijan/vscode-office/issues/597)）——本專案已修復。

上游 issue 在本專案的處理情況見 [docs/issues/cweijan-issues/ISSUES.md](docs/issues/cweijan-issues/ISSUES.md)。

如果本擴充功能對你有幫助，也歡迎給[原始專案](https://github.com/cweijan/vscode-office)點一個 ★。

## 介紹

本擴充功能支援在 VS Code 中直接預覽與編輯以下常見的辦公與設計檔案：

- Excel: `.xls`、`.xlsx`、`.xlsm`、`.csv`、`.ods`
- Word: `.docx`、`.dotx`
- PowerPoint: `.pptx`、`.pptm`
- PDF 與電子書: `.pdf`、`.epub`
- HEIC/TIFF: `.heic`、`.heif`、`.tiff`
- 設計檔案: `.psd`、`.xmind`、`.icns`、`.svg`
- 字型: `.ttf`、`.otf`、`.woff`、`.woff2`
- Markdown: `.md`、`.markdown`
- HTML: `.html`、`.htm`
- HTTP 請求: `.http`、`.rest`
- Java: `.class`（反編譯）
- 壓縮檔案: `.zip`、`.jar`、`.vsix`、`.rar`、`.7z`、`.tar`、`.tar.gz`、`.tgz`、`.apk`

## 常見使用問題

- [Markdown：預設使用 VS Code 原生編輯器](docs/faq/markdown-default-editor-CN.md)
- [Markdown：匯出操作](docs/faq/markdown-export-CN.md)
- [Markdown 編輯器快捷鍵](docs/faq/markdown-shortcuts.md)

## 其他功能

- HTML: 編輯時按下 `Ctrl+Shift+V` 可即時預覽
- YAML: 支援文件大綱與錨點導覽（別名引用可跳轉到定義）
- 圖示主題: 內建 [Material Icon Theme](https://github.com/PKief/vscode-material-icon-theme) 部分圖示，並提供 **Office Material Icon Theme** 與 **One Dark Modern** 配色主題
- Excel: 支援預覽與儲存 `.xlsx`、`.xls`、`.xlsm`、`.csv`、`.ods` 等檔案
- HTTP: 在 `.http`、`.rest` 檔案中傳送請求（整合自 [REST Client](https://github.com/Huachao/vscode-restclient)，並修正了本地請求的已知問題）；按 `Ctrl+Enter` / `⌘ Enter` 傳送
- Java: 開啟 `.class` 檔案可反編譯並查看原始碼

## 開發指南

參閱 [docs/dev/development-CN.md](docs/dev/development-CN.md) 了解環境要求、除錯、建置與發佈。

## 隱私

本 Fork **不收集**任何使用資料或遙測資訊，所有預覽與編輯均在 VS Code 本機完成。

## Credits

- 上游專案: [cweijan/vscode-office](https://github.com/cweijan/vscode-office)（Office Viewer）——本 fork 基於此專案
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
