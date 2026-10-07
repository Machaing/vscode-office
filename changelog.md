# Change log

> [简体中文版](changelog-CN.md) | History (4.1.7 and earlier) archived in [docs/archive/changelog-archive.md](docs/archive/changelog-archive.md)

> Please report issues to [Machaing/vscode-office](https://github.com/Machaing/vscode-office/issues); this is an independently maintained fork, do not report to the upstream [cweijan/vscode-office](https://github.com/cweijan/vscode-office).

# 4.2.2 2026-10-6

Markdown Editor:

- Support customizing editor keybindings; add Ctrl+Shift+Z for redo; macOS no longer occupies ⌘H. ([cweijan/vscode-office#204](https://github.com/cweijan/vscode-office/issues/204), [cweijan/vscode-office#218](https://github.com/cweijan/vscode-office/issues/218))
- Add a keybinding cheatsheet panel to the toolbar.
- Support configuring the editor UI language.
- Fix inline HTML tags (kbd/mark/span/u/br/img) being lost on save. ([cweijan/vscode-office#226](https://github.com/cweijan/vscode-office/issues/226))

# 4.2.1 2026-9-15

Word:

- Fix table rows being split across pages; move the whole row to the next page. ([cweijan/vscode-office#497](https://github.com/cweijan/vscode-office/issues/497))
- Fix blank TIFF images by decoding to PNG before rendering. ([cweijan/vscode-office#311](https://github.com/cweijan/vscode-office/issues/311))
- Fix TOC entry text loss. ([cweijan/vscode-office#597](https://github.com/cweijan/vscode-office/issues/597))

Markdown Editor:

- Add `office.markdown.find` command to make find jump to matches. ([cweijan/vscode-office#599](https://github.com/cweijan/vscode-office/issues/599))
- Fix files showing as dirty on open and silent rewrites on save. ([cweijan/vscode-office#596](https://github.com/cweijan/vscode-office/issues/596))
- Fix trailing blank lines being removed after switching windows. ([cweijan/vscode-office#601](https://github.com/cweijan/vscode-office/issues/601))
- Fix ordered-list numbers lost on heading conversion. ([cweijan/vscode-office#590](https://github.com/cweijan/vscode-office/issues/590))
- Fix cramped code block lines caused by line-height and font-size mismatch. ([cweijan/vscode-office#571](https://github.com/cweijan/vscode-office/issues/571))
- Restore GFM table sizing; remove cell width and wrapping limits. ([cweijan/vscode-office#575](https://github.com/cweijan/vscode-office/issues/575))

Excel:

- Truncate oversized CSV/XLSX files to a read-only preview to prevent frozen windows and OOM. ([cweijan/vscode-office#239](https://github.com/cweijan/vscode-office/issues/239))
- Fix `$` formulas not being calculated.
- Fix percent format decimals; align formula display and save round-trip with Excel. ([cweijan/vscode-office#592](https://github.com/cweijan/vscode-office/issues/592))
- Fix webview crash on corrupted XLSX; fall back to SheetJS with an error message. ([cweijan/vscode-office#576](https://github.com/cweijan/vscode-office/issues/576))

PDF:

- Fix internal link navigation and external link detection. ([cweijan/vscode-office#593](https://github.com/cweijan/vscode-office/issues/593))

Export:

- Fix exports silently producing blank PDF/DOCX/HTML on failure; errors now surface. ([cweijan/vscode-office#603](https://github.com/cweijan/vscode-office/issues/603))

# 4.2.0 2026-8-16

Markdown Editor:

- Support configuring automatic focus restoration.
- Reduce redundant focus restoration when switching tabs.
- Fix Shift+Enter not working in IR mode.
- Fix Markmap and heading anchor jumps in IR mode.

PDF:

- Update PDF.js to v3.1.
- Remove the extra green indicator on the bookmark sidebar.

XMind:

- Fix inability to drag the canvas.

Git History:

- Improve reset button hover color.
- Improve toolbar button placement.

# 4.1.9 2026-8-13

Markdown Editor:

- Support rendering workspace images.
- Support pasting images to workspace paths.
- Support Markmap diagrams with interactive features.
- Support WikiLink graph.
- Fix overlapping alert text in IR mode.
- Fix input issues after leaving the math formula editor.

Excel:

- Support opening empty XLSX files.

XMind:

- Support editing XMind files.

SVG:

- Support customizing the preview overlay.
- Use HTML syntax to support inline CSS highlighting.

Git History:

- Show details for stash and uncommitted changes.

Editor:

- Change dirty indicator to asterisk.

# 4.1.8 2026-7-28

Excel:

- Add insert image support.
- Add image crop tools.
- Add pivot table read/write support.
- Add select-all-cells support.
- Add advanced replace options.
- Improve XLSX loading performance.
- Improve image selection and dragging behavior.
- Fix inaccurate image drag anchor positioning.
- Hide the theme toggle while loading.

Markdown Editor:

- Fix link and image edit popover layout issues.
- Align frontmatter property key icons.

PDF:

- Improve sidebar styling.

---

History (4.1.7 and earlier): [docs/archive/changelog-archive.md](docs/archive/changelog-archive.md) | [简体中文版](changelog-CN.md)
