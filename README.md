# Office Viewer Enhance

English | [简体中文](README-CN.md) | [繁體中文](README-TW.md)

## Overview

**Office Viewer Enhance** aims to provide a VS Code file-preview extension with **faster issue response and more powerful features** than the original repository. It is a fork of [cweijan/vscode-office (Office Viewer)](https://github.com/cweijan/vscode-office) — many thanks to [cweijan](https://github.com/cweijan) for creating and maintaining the original extension — and is published independently so fixes land faster. For example:

- Excel formulas containing absolute references (e.g. `=E6/$E$9`) displayed `NaN%` — the cached result stored in the file is now shown, and `$` references are evaluated correctly.
- Word documents with an auto-generated table of contents lost the entry text and showed page numbers only ([upstream #597](https://github.com/cweijan/vscode-office/issues/597)) — fixed in this fork.

How upstream issues are handled in this fork is tracked in [docs/issues/cweijan-issues/ISSUES.md](docs/issues/cweijan-issues/ISSUES.md).

If this extension helps you, please also consider giving a ★ to [the original project](https://github.com/cweijan/vscode-office).

## Introduction

This extension lets you preview and edit common office and design files directly in VS Code.

- Excel: `.xls`, `.xlsx`, `.xlsm`, `.csv`, `.ods`
- Word: `.docx`, `.dotx`
- PowerPoint: `.pptx`, `.pptm`
- PDF & eBook: `.pdf`, `.epub`
- HEIC/TIFF: `.heic`, `.heif`, `.tiff`
- Design: `.psd`, `.xmind`, `.icns`, `.svg`
- Font: `.ttf`, `.otf`, `.woff`, `.woff2`
- Markdown: `.md`, `.markdown`
- HTML: `.html`, `.htm`
- HTTP request: `.http`, `.rest`
- Java: `.class` (decompiler)
- Compressed files: `.zip`, `.jar`, `.vsix`, `.rar`, `.7z`, `.tar`, `.tar.gz`, `.tgz`, `.apk`

## FAQ

- [Markdown: use the built-in VS Code editor](docs/faq/markdown-default-editor.md)
- [Markdown: export to PDF / DOCX / HTML](docs/faq/markdown-export.md)
- [Markdown editor shortcuts](docs/faq/markdown-shortcuts.md)

## Other features

- HTML: live preview while editing; press `Ctrl+Shift+V` to open the live view
- YAML: document outline and anchor navigation (Go to Definition for alias references)
- Icon theme: includes a subset of [Material Icon Theme](https://github.com/PKief/vscode-material-icon-theme) icons, plus **Office Material Icon Theme** and **One Dark Modern** color themes
- Excel: preview and save `.xlsx`, `.xls`, `.xlsm`, `.csv`, and `.ods` files
- HTTP: send requests from `.http` and `.rest` files (integrated from [REST Client](https://github.com/Huachao/vscode-restclient) with fixes for local request issues); press `Ctrl+Enter` / `⌘ Enter` to send
- Java: decompile and view `.class` files

## Development

See [docs/dev/development.md](docs/dev/development.md) for prerequisites, debugging, build, and publishing.

## Privacy

This fork does **not** collect any usage data or telemetry. All preview and editing happens locally within VS Code.

## Credits

- Upstream project: [cweijan/vscode-office](https://github.com/cweijan/vscode-office) (Office Viewer) — this fork is based on it
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
