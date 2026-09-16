# Change log

> [简体中文版](docs/changelog-CN.md) | History (4.1.6 and earlier) archived in [docs/archive/changelog-archive.md](docs/archive/changelog-archive.md)

# 4.2.1 2026-9-15

Word:

- Fix table rows being split across pages; move the whole row to the next page.
- Fix blank TIFF images by decoding to PNG before rendering.
- Fix TOC entry text loss.

Markdown Editor:

- Add `office.markdown.find` command to make find jump to matches.
- Fix files showing as dirty on open and silent rewrites on save.
- Fix trailing blank lines being removed after switching windows.
- Fix ordered-list numbers lost on heading conversion.
- Fix cramped code block lines caused by line-height and font-size mismatch.
- Restore GFM table sizing; remove cell width and wrapping limits.

Excel:

- Truncate oversized CSV/XLSX files to a read-only preview to prevent frozen windows and OOM.
- Fix `$` formulas not being calculated.
- Fix percent format decimals; align formula display and save round-trip with Excel.
- Fix webview crash on corrupted XLSX; fall back to SheetJS with an error message.

PDF:

- Fix internal link navigation and external link detection.

Export:

- Fix exports silently producing blank PDF/DOCX/HTML on failure; errors now surface.

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

# 4.1.7 2026-7-24

Markdown Editor:

- Support hard line breaks (`Shift+Enter`).
- Support opening PlantUML diagrams in the browser.
- Update Mermaid toolbar color scheme.
- Update Edit in VS Code icon color.

Excel:

- Add auto-fit columns action.
- Update toolbar VS Code icons.
- Polish sheet tab interaction area (WPS-style navigation, sheet list menu, and active tab scrolling).
- Fix:
  - Tolerate unsupported formats and formulas.
  - Fix inaccurate cell positioning after scrolling.
  - Fix workbook loading failure caused by expanded data validation rules.
  - Fix merged cell region recognition for the default selected cell.
  - Fix CSV loading failure when the first row is empty.

PDF:

- Add PDF Pro tools and polish the tools dialog.

Git History:

- Improve details dialog positioning.

---

History (4.1.6 and earlier): [docs/archive/changelog-archive.md](docs/archive/changelog-archive.md) | [简体中文版](docs/changelog-CN.md)
