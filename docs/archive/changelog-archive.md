# Changelog Archive

> [简体中文版](changelog-archive-CN.md) | History (4.1.7 and earlier). See [changelog.md](../../changelog.md) for the latest versions.

---

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

# 4.1.6 2026-7-20

Markdown Editor:

- Focus the find input after clicking the find button.
- Fix anchor and footnote jump failure in documents.

Excel:

- Add formula bar.
- Improve VS Code theme compatibility.
- Add an Edit in VS Code action to the CSV editor toolbar.
- Add filter changes to history and increase zoom debounce delay.
- Fix:
  - Fix inability to save edited empty CSV files.
  - Sync clipboard highlight when switching sheets.
  - Prevent image selection when selecting a range.
  - Prevent images from appearing across all sheets.

Diff:

- Skip CSV and DOCX files in diff view.

# 4.1.5 2026-7-8

Fix:

- Fix unexpected file reload on edit.
- Prevent Zip Slip path traversal in archive extraction(Reported by Mykhailo Kholiev).

Git History:

- Improve git history view UI.
- Change date format to yyyy-MM-dd.
- Support more remote URL formats.

Markdown Editor:

New:

- Add Shift+Tab support.
- Add typewriter mode support.
- Add new line button for quick row insertion.
- Support quick drag to resize images(Pro Feature).

Update:

- Improve large file editing performance.
- Add replace feature to find component.
- IR mode: support block drag-and-drop and table enhancements.
- Beautify context menu and settings modal.
- Remove automatic double quote completion.
- Remove default 400px code block height limit.

Fix:

- Fix failure to edit tags and wikilinks normally.
- Fix extra blank line left after deleting sublist
- Fix settings modal closing when deleting prompt or model.

Excel:

Update:

- Copy cells with HTML formatting.
- Support zoom adjustment via scroll wheel.
- Preserve formatting when pasting from Excel.
- Support editable image drag and resize.
- Support cell selection in config function.
- Improve user interaction and context menu appearance.
- Change page scrolling from cell-based to pixel-based.

Fix:

- Fix find component focus accuracy.
- Fix vertical alignment display error.
- Fix cell text overflow, editor overlay, and row height.
- Fix cell interaction and descending sort after sorting.

# 4.1.3-4 2026-7-3

Fix:

- Fix SVG loading failure.
- Fix PPTX loading failure.

# 4.1.2 2026-7-3

Markdown Editor:

- Improve AI review panel.
- Add quick action presets for AI Polish.
- Add output language selection for AI Polish.

Fix:

- Fix math formulas and diagrams (Mermaid, PlantUML) not rendering correctly after code block lazy-loading optimization.

# 4.1.1 2026-7-3

Markdown Editor:

- Add code search support within code blocks.
- Improve editor performance when handling multiple code blocks.

Export:

- Move PDF export margin inside the content container.
- Upgrade html-to-docx for improved DOCX export quality.
- Dynamically load export dependencies (HTML, DOCX, PDF) to reduce extension size.

Git History:

- Add warning echo for Git operations.
- Fix graph being incorrectly dimmed.
- Align author filter options and simplify filtered graph.

Update:

- Improve view rendering performance.
- Replace cheerio with node-html-parser.
- Dynamically load Mermaid and Puppeteer to reduce extension size.

Fix:

- Resolve inline HTML rendering issue.
- Resolve file loading failure on Windows virtual space.

# 4.1.0 2026-7-1

New: Add Parquet file format support.

Markdown Editor:

- Improve visual design.
- Update keyboard shortcuts.
- Support code block font configuration.
- Improve light/dark mode switching logic.
- Fix failure to open relative path files in IR mode.
- Support font size adjustment via scroll wheel in the editor.

Pro:

- Introduce Pro license activation.
- Remove Sponsor banner after Pro activation.
- Support custom font color and background color editing.
- Support adjusting image width and height in the Markdown editor.
- Support beautiful PDF / HTML / DOCX export with theme, font, and font-size options.

Git History:

- Improve visual design.
- Adjust Git branch colors for better visibility in light mode.
- Gray out non-current commits while loading Git history view.
- Fix color inconsistency between graph lines and branches in Git history view.

# 4.0.9 2026-6-29

Update:

- Restore missing HTML viewer previewer registration.
- Fix outline loading failure caused by special headings (code blocks, line breaks).
- Improve file loading performance by streaming via webview URI instead of message buffer transfer.

# 4.0.8 2026-6-29

Markdown editor:

Update:

- Add image preview.
- Beautify CodeMirror toolbar.
- Disable latex syntax validation.
- Remember last selected theme preference.
- Sync settings to other editors after modification.
- Support expandable code blocks with configurable height.

Git History:

- Improve Git view and Git history view styling.
- Support double-click to quick push in Git view.
- Git history view supports pull and batch operations.

Fix:

- Support saving links with spaces.
- Fix class file decompilation failure.
- Fix Wikilinks in remote environment.
- Preserve bold text color in light theme.
- Prevent file cache generation after each view.
- Fix relative links and images in remote environment.
- Fix markdown editor loading issue for Russian locale.
- Fix the missing margin for the first child element at the top of the page.

# 4.0.7 2026-6-26

New:

- Support editing Vditor configuration via a configuration file.
- Markdown editor supports remote and web workspaces (vscode-vfs, vscode-remote).

Update:

- Beautify alert color.
- Improve PDF loading performance.
- Improve Git history view styling.
- Improve TIFF/HEIC loading performance.
- Change the default Excel font size to 11.
- Remove Git history caching for more accurate data.

Markdown:

- Add AI polish usage tip in settings panel.
- Fix CodeMirror font not syncing with typography settings.
- Fix pasted math formula blocks being converted into code blocks.

Fix:

- Fix incorrect read-only mode detection.
- Fix remote URL order in Git view with multiple repositories.

# 4.0.6 2026-6-26

New:

- Full support for Excel.
- Support editing DOCX files.
- Support the web version of VS Code.

Markdown:

- Support Wikilinks.
- Support AI-powered polishing.
- Support configuring editor typography.
- Support previewing and editing inline HTML.
- Support highlighting and autocompletion for latex formulas.

# 4.0.5 2026-6-23

Important: **Refactor Markdown editor**: beautified UI with modernized toolbar, in-page search (Ctrl/Cmd+F), and real-time code block editing

Other:

- Update Material Icons
- Add Kusto (KQL) syntax highlighting
- Beautify Git history view: refreshed styling and a commit details panel
- Support batch Git operations: push branches, add tags, and delete tags across multiple remotes in one action

# 4.0.4 2026-6-19

New:

- Add Kotlin syntax highlighting
- Add Nginx conf syntax highlighting
- Add anonymous usage telemetry (respects VS Code global telemetry settings)

Update:

- Beautify the SVG and PDF view
- Hide sponsor banner in Excel view while loading
- Refresh Git history after deleting filtered branches

# 4.0.3 2026-6-18

Important:

- Redesign the One Dark Modern theme
- Add Git history management feature

New:

- Add SVG editor
- Add support for ODS format
- Add syntax highlighting for TOML
- Add YAML outline and anchor navigation support

Update:

- Add dark mode toggle to PDF viewer
- Update markdown editor default theme
- Add icons for Parquet, SQLite, and DuckDB
- Change the default PPTX view to light mode
- Support quick switch color in markdown editor

# 4.0.2 2026-6-15

- Integrate HTTP client for `.http` and `.rest` files
- Support XMind, PSD, ICNS, HEIC and TIFF formats

# 4.0.1 2026-6-14

- Better zip viewer
- Fix excel save tip gone

# 4.0.0 2026-6-14

- Support pptx and epub files
- Support 7zip and tar.gz archives
- Better support for docx, excel, pdf and archives

# 3.5.7 2026-6-12

- Fixed paste image failed in markdown editor

# 3.5.6 2026-6-10

- Update puppeteer-core version
- Beautify zip,font,image and markdown view
- Fix command 'office.markdown.paste' hijacks ctrl/cmd+v

# 3.5.5 2026-6-8

- Update mermaid version
- Integrate Vditor resources
- Fix Excel cell shortcut keys not working on MacOS

# 3.5.4 2025-4-28

- Support edit excel and csv file.

# 3.5.3 2025-4-17

- Support view rar file.

# 3.5.2 2025-4-10

- Compatible with rest client.

# 3.5.1 2025-4-7

- Better support for zip viewer.
- Update extension name and icon.
- Support export markdown with Mermaid.

# 3.5.0 2025-1-14

- Remove markdown editor border.

# 3.4.8 2024-12-14

- Modify the font of the markdown editor.

# 3.4.6 2024-12-13

- Add more markdown editor theme.
- Support refresh for zip viewer.

# 3.4.2 2024-9-28

- Fixed "Edit In VS Code" shortcut not working.
- Fixed copying content failure in preview mode.

# 3.3.4 2024-6-4

- Better csv and zip support.

# 3.3.3 2024-5-6

- Support edit svg in VS Code.
- Fix shortcut key conflict with Copilot.
- Support display font item name and search font item.

# 3.3.2 2024-4-6

- Support sort zip items.

# 3.3.1 2024-3-30

- Update font and pdf viewer.

# 3.3.0 2024-3-29

- Rewrite the UI front end using React.

# 3.2.5 2024-3-8

- Add shortcut document.
- Update editor switch icon.
- Fix load chinese zip entry failed.

# 3.2.4 2024-3-5

New:

- Support view woff2 font.
- Support modifying editor theme individually.

Markdown

- Follow vscode editor font size.
- Add button to quick switch markdown editor.

Other:

- Support edit in vscode for csv.
- Support edit in vscode for svg.
- Only use image viewer for svg.

# 3.2.0 2024-3-4

- Use vscode default editor when diffing.
- Fix cannot save outline state for macOS.
- Fix cannot find chromium path on macOS.

# 3.1.7 2023-9-32

- Fix export markdown to docx fail.

# 3.1.5 2023-5-18

- Support view apk file.

# 3.1.4 2023-5-4

- Support view zip file.

# 3.1.2 2023-4-25

- Change inactive tab foreground color.

# 3.1.1 2023-4-24

- Update peek view colors.
- Remove semantic highlighting.

# 3.1.0 2023-4-13

- Better theme colors.
- Markdown:
  - Katex compatible wrong formula.
  - Load the chart with a white background.
  - Support for rendering latex formulas in an offline environment.

# 3.0.4 2023-4-11

- Modify the background color of the theme.

# 3.0.2 2023-4-5

- Update extension icon.

# 3.0.1 2023-4-3

- Fix git view cannot view pictures.
- Support for reloading workspace docx after file changes.
- PDF:
  - Fixed sometimes opening PDF failed.
  - Do not display the sidebar on small screens.
  - Support export markdown to pdf without outline.

# 3.0.0 2023-3-29

- Better docx rendering.

# 2.9.6 2023-3-7

- Reduce the size of the excel save notice.
- Support resizing the view through ctrl/meta with mouse scrolling.
- Word:

  - Fix cannot display images.
  - Fix pager jumping incorrectly.
  - Reduce pagination navigator size.
- Markdown:

  - Support hide toolbar.
  - Fix extension activation failure when rest client exists.
  - Support open hyperlinks via meta or middle mouse button.

# 2.9.5 2023-1-12

- Update the editorInlayHint color of the theme.
- Markdown:
  - Code block preview shows line numbers.
  - Support configuring code block color style.
  - Add workspaceDir variable to the pasted image path.
  - Fix PDF export failure.
  - Fix absolute-path images not displaying.

# 2.9.4 2022-12-20

- Adjust code block colors.
- Support setting the chromium path for PDF export.

# 2.9.3 2022-12-10

- Fix some PDF fonts failing to load.
- Polish border colors of QuickItem and menus.

# 2.9.2 2022-12-6

- Fix the table toolbar disappearing.
- Add a confirmation dialog when saving xlsx.
- Do not generate TOC when exporting HTML and docx.
- Fix image file names not displaying when there are many images.

# 2.9.1 2022-11-23

- Adjust the outline width of the markdown editor on small screens
- Adjust page margins of PDF converted from Markdown.

# 2.9.0 2022-11-9

- Speed up extension activation.

# 2.8.1 2022-10-29

- Fix preview html unable to load images.
- Markdown:
  - Support export to docx.
  - Fix hr can not display on dark theme.
  - Edit math formulas using different background colors.
  - Fix export pdf not rendering math formulas that start or end with spaces.

# 2.8.0 2022-10-24

- Change markdown editor default language to english.
- Supporting change of language for editor [en_US, ja_JP, ko_KR, ru_RU, zh_CN, zh_TW]

# 2.7.9 2022-10-23

- Fix toolbar loss on small screens.

# 2.7.8 2022-10-19

- Markdown:
  - Fix math formula display issues in exported PDF.
  - Improve markdown rendering of built-in themes.
- Pdf:
  - Show outline view by default.
  - Polish some visual effects.
  - Fix only second-level outline showing.

# 2.7.7 2022-10-18

- markdown:
  - Upgrade katex version.
  - Pin the toolbar position.
  - Remember the last edit position of the file.
  - Fix word count not updating when switching markdown files.
  - Fix toolbar style issues on small screens and outline not displaying.

# 2.7.5 2022-10-12

- Improve focus handling when switching outline.

# 2.7.4 2022-10-11

- markdown
  - Fix word count not updating in real time.
  - Fix images not displaying in diff view.
  - Fix content not refreshing after external edits in some cases.
- Fix excel unable to save updates.
- Image viewer supports ctrl + scroll to zoom.

# 2.7.3 2022-10-5

- Improve focus logic.
- Support ctrl+shift+v to paste as plain text.
- Add automatic webview cache cleanup.
- Markdown:

  - Detect pasted image type automatically.
  - Fix selected text remaining after pasting text.
- HTML preview supports parsing local js files.

# 2.7.2 2022-9-15

- Remove spaces in image paths.
- Fix latex formulas being cut off.

# 2.7.1 2022-9-5

- Improve editor focus restoration.

# 2.7.0 2022-9-2

- Upgrade vditor version.
- Add a delay setting for editor focus.
- Beautify the context menu; hide it when clicking elsewhere.

# 2.6.9 2022-8-29

- Fix abnormal code block background color.

# 2.6.8 2022-8-28

- Markdown: fix the absolute-path image setting not working.
- Xlsx:
  - Support viewing xlsm files.
  - Speed up opening excel files.
  - Fix columns beyond 26 not displaying in xlsx.

# 2.6.7 2022-8-28

- Markdown:
  - Fix horizontal rules not displaying.
  - Remove single quote and dollar sign completion.
  - Use circled numbers for TOC numbering in exported PDF.
  - Support disabling code preview and changing code block background color.
- Fix page disorder when viewing docx files with many pages.

# 2.6.1 2022-6-19

- Fix relative-path markdown files not opening in Vditor.

# 2.6.0 2022-6-13

- Improve theme adaptation.
- Fix unrelated logs printed while editing markdown.

# 2.5.8 2022-6-7

- Support opening dotx files
- Markdown editor supports opening image hyperlinks
- Update hyperlink colors

# 2.5.7 2022-6-7

- Improve the image pasting logic
- Improve border colors of the auto theme
- Update word count after saving
- Change the default code theme

# 2.5.5 2022-5-28

- Support configuring the pasted image path for markdown
- Update the vditor version

# 2.5.1 2021-12-29

- Improve stability; fix images occasionally failing to save
- Support save outline open state.

# 2.5.0 2021-12-27

- Update markdown editor:
  - To open a hyperlink, need to hold down ctrl.
  - Support chose image from toolbar.
  - Update editor when external update.
  - Open source code editor as beside.
- Fix puml editor not trigger save.
- Fix html preview not support untitle document.

# 2.4.2 2021-12-4

- Fix markdown editor cannot cut, loss focus.

# 2.4.1 2021-9-9

- Rollback docx support.
- Fix http auto-complection fail.
- Reduce markdown editor cache usage.

# 2.4.0 2021-8-3

- Better http client support.
- Fix markdown editor cannot save.

# 2.2.2 2021-6-19

- Speed up picture pasting

# 2.2.0 2021-6-2

- Not trigger vscode hotkey when match markdown hotkey.
- Support immediately preservation.

# 2.1.1 2021-5-27

- Change vditor mode from ir to wysiwyg.
- Fix markdown cannot type tab.
- Reduce markdown editor padding.

# 2.0.0+

- Support ods file.
- Remove top button of word document.
- Remove markdown style.
- Support inline markdown.
- Support export to html.
- Markdown support auto quote.
- Change viewer name as editor.
- Change default markdown editor as vditor.

# 1.9.1 2021-1-18

- Fix cannot view big xmind.
- Support follow theme with docx viewer.
- Image viewer support show pixel.

# 1.9.0 2020-12-30

- Support view csv file with utf8 encoding.

## 1.8.9 2020-12-21

- Update java decompiler version, change priority as option.
- Markdown editor support paster as plain text.

## 1.8.1 2020-11-24

- Change export markdown pdf chinese font to 'Song  style'
- Export markdown auto add bookmarks.
- Update markdown list style.

## 1.8.0 2020-11-24

- Support play flash swf animation.

## 1.7.10 2020-11-23

- Support open link from markdown.

## 1.7.9 2020-11-19

- support paste image file in markdown editor.

## 1.7.7 2020-11-17

- Update status bar when open markdown editor.

## 1.7.5 2020-11-11

- Add java class decompiler.

## 1.7.1 2020-11-3

- Support generate outline for pdf.

## 1.7.0 2020-11-2

- Support export markdwon to pdf.
- Support edit xlsx、xls、csv.

## 1.6.0 2020-10-19

- Add font viewer.
- Adjust markdown style and fix save fail bug.

## 1.5.0 2020-10-16

- Enhance Image viewer.

## 1.4.3 2020-10-12

- Fix paste fail in terminal.
- Using hyperMD as default markdown editor.

## 1.4.0 2020-10-9

- Integrate stackedit to edit markdown.
- Add csv support.

## 1.3.0 2020-10-8

- Add plantuml support.
- Adjust svg css.

## 1.2.0 2020-10-8

- Add pdf support.
- Add xmind support.

## 1.1.0 2020-10-8

- Add epub support.
- Add svg support.
- Add photoshow support.
- Add windows reg support.
- Add paginition to docx view..
