# 测试文档工作区

覆盖扩展所支持的全部文件格式,按格式类别分文件夹。目录已纳入 git 管理,仅可重新生成的
大体积复现文件与构建产物由 `.gitignore` 排除。

用法: 用 VS Code 打开本目录(或直接从资源管理器打开文件),扩展会按 `package.json` 的
`customEditors` selector 自动路由到对应查看器。

## 目录结构

| 文件夹 | 文件 | 查看器 (route) | 覆盖的测试点 |
| --- | --- | --- | --- |
| `excel/` | sample.xlsx / xlsm / xls / ods / csv / tsv | officeViewer (`excel`) | 多 Sheet、公式(SUM/TEXT/绝对引用)、样式、边框、合并单元格、冻结窗格、图表(xlsx);BIFF8 旧格式(xls);中文与引号转义(csv/tsv) |
| `word/` | sample.docx / dotx; issue-597-toc.docx / issue-597-toc-plain.docx | officeViewer (`word`) | 标题层级、粗斜体、彩色文字、有序/无序列表、表格样式、引用; issue-597 两组 TOC 域复现数据(见 `docs/fix-issue/cweijan/issue-597.md`) |
| `powerpoint/` | sample.pptx / pptm | officeViewer (`ppt`) | 标题版式、项目符号、多级缩进、彩色加粗文本、3 页翻页 |
| `pdf/` | sample.pdf | pdf.js viewer | 双页导航、矢量图形、旋转水印文本 |
| `epub/` | sample.epub | officeViewer (`epub`) | OPF/NCX 结构、目录导航、CSS、中文章节、blockquote |
| `font/` | sample.ttf / woff / woff2 / sample2.woff2 / otf | officeViewer (`font`) | 字形预览(KaTeX 字体 + 系统 OTF) |
| `image/` | png / jpg / jpeg / pjpeg / pjp / gif / bmp / ico / cur / webp / apng | imageViewer | 静态图、动画 GIF、多尺寸 ICO、带热点的 CUR、动画 APNG |
| `svg/` | sample.svg | officeViewer (`svg`) | 线性/径向渐变、路径、SMIL 动画、滤镜、中文文本 |
| `icns/` | sample.icns | officeViewer (`icns`) | ic07(128)/ic08(256) PNG 条目 |
| `psd/` | sample.psd | officeViewer (`psd`) | 未压缩 RGB 合成图像(128×128 渐变) |
| `xmind/` | sample.xmind | officeViewer (`xmind`) | XMind Zen content.json 结构、多级节点 |
| `tiff/` | sample.tif / tiff | officeViewer (image) | 单页与多页 TIFF(utif 解码) |
| `heif/` | (见目录内 README) | officeViewer (heic2any) | HEIC 为相机容器格式,无法脚本生成,需真实样本 |
| `archive/` | zip / 7z / tar / tar.gz / tgz / jar / apk / vsix / crx (+rar 见 README) | archiveViewer | 嵌套目录、压缩方式差异、各自容器格式的头结构 |
| `markdown/` | sample.md / markdown | markdownViewer (vditor) | front-matter、表格、任务列表、多语言代码块、KaTeX 公式、Mermaid 图表、脚注、相对路径图片、emoji |
| `html/` | sample.html / htm / xhtml | htmlViewer | 内联 CSS/JS、表格交互、相对路径资源、严格 XHTML 语法 |
| `parquet/` | sample.parquet | parquetViewer | 中文 BYTE_ARRAY / INT64 / DOUBLE 列 |
| `java/` | IdeaDecompiler.class / CodeConstants.class | classViewer | 从 `resource/java-decompiler.jar` 提取的真实字节码(魔数 CAFEBABE) |
| `http/` | sample.http / rest | 文本编辑器 + HTTP Client | 环境变量、JSON/表单/multipart 请求体、请求链、响应断言 |

另: `excel/formula-dollar-ref.xlsx` 为此前手动调试遗留文件,与生成脚本无关。

## issue 复现文件

上游(cweijan) issue 专用复现数据,命名 `test-{格式}-cweijan-{编号}-{slug}.{ext}`。
生成与登记规范见 [.claude/skills/issue-plan/SKILL.md](../.claude/skills/issue-plan/SKILL.md);
交互类 bug(快捷键/粘贴/焦点等)的文件仅为操作载体,复现步骤见对应 plan 的「复现数据」章节。

| 编号 | 复现文件 | 生成脚本 | plan |
| --- | --- | --- | --- |
| [#157](https://github.com/cweijan/vscode-office/issues/157) | [markdown/test-markdown-cweijan-157-list-nested-table.md](markdown/test-markdown-cweijan-157-list-nested-table.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-157-list-nested-table.md) |
| [#204](https://github.com/cweijan/vscode-office/issues/204) | [markdown/test-markdown-cweijan-204-redo-shortcut-wysiwyg.md](markdown/test-markdown-cweijan-204-redo-shortcut-wysiwyg.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-204-redo-shortcut-wysiwyg.md) |
| [#218](https://github.com/cweijan/vscode-office/issues/218) | [markdown/test-markdown-cweijan-218-cmd-h-heading-conflict.md](markdown/test-markdown-cweijan-218-cmd-h-heading-conflict.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-218-cmd-h-heading-conflict.md) |
| [#221](https://github.com/cweijan/vscode-office/issues/221) | [excel/test-excel-cweijan-221-csv-copy-paste.csv](excel/test-excel-cweijan-221-csv-copy-paste.csv) | - | [plan](../docs/plans/done/plan-cweijan-issues-221-csv-copy-paste.md) |
| [#226](https://github.com/cweijan/vscode-office/issues/226) | [markdown/test-markdown-cweijan-226-kbd-tag-backtick.md](markdown/test-markdown-cweijan-226-kbd-tag-backtick.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-226-kbd-tag-backtick.md) |
| [#239](https://github.com/cweijan/vscode-office/issues/239) | [excel/test-excel-cweijan-239-large-csv.csv](excel/test-excel-cweijan-239-large-csv.csv) | [issue_239_large_csv_hang.py](_generate-script/issue_239_large_csv_hang.py) | [plan](../docs/plans/done/plan-cweijan-issues-239-large-csv-hang.md) |
| [#262](https://github.com/cweijan/vscode-office/issues/262) | [markdown/test-markdown-cweijan-262-paste-image-insiders.md](markdown/test-markdown-cweijan-262-paste-image-insiders.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-262-paste-image-insiders.md) |
| [#295](https://github.com/cweijan/vscode-office/issues/295) | [markdown/test-markdown-cweijan-295-image-disappear.md](markdown/test-markdown-cweijan-295-image-disappear.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-295-image-disappear.md) |
| [#308](https://github.com/cweijan/vscode-office/issues/308) | [markdown/test-markdown-cweijan-308-image-rename-variable.md](markdown/test-markdown-cweijan-308-image-rename-variable.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-308-image-rename-variable.md) |
| [#311](https://github.com/cweijan/vscode-office/issues/311) | [word/test-word-cweijan-311-tif-image.docx](word/test-word-cweijan-311-tif-image.docx) | [issue_311_tif_image.py](_generate-script/issue_311_tif_image.py) | [plan](../docs/plans/done/plan-cweijan-issues-311-tif-image.md) |
| [#323](https://github.com/cweijan/vscode-office/issues/323) | [markdown/test-markdown-cweijan-323-switch-editor-shortcut.md](markdown/test-markdown-cweijan-323-switch-editor-shortcut.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-323-switch-editor-shortcut.md) |
| [#394](https://github.com/cweijan/vscode-office/issues/394) | [markdown/test-markdown-cweijan-394-image-upload-path.md](markdown/test-markdown-cweijan-394-image-upload-path.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-394-image-upload-path.md) |
| [#405](https://github.com/cweijan/vscode-office/issues/405) | [markdown/test-markdown-cweijan-405-image-placeholder.md](markdown/test-markdown-cweijan-405-image-placeholder.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-405-image-placeholder.md) |
| [#415](https://github.com/cweijan/vscode-office/issues/415) | [excel/test-excel-cweijan-415-s3-save-error.xlsx](excel/test-excel-cweijan-415-s3-save-error.xlsx) | [issue_415_s3_save_error.py](_generate-script/issue_415_s3_save_error.py) | [plan](../docs/plans/todo/plan-cweijan-issues-415-s3-save-error.md) |
| [#497](https://github.com/cweijan/vscode-office/issues/497) | [word/test-word-cweijan-497-cross-page-table.docx](word/test-word-cweijan-497-cross-page-table.docx) | [issue_497_cross_page_table.py](_generate-script/issue_497_cross_page_table.py) | [plan](../docs/plans/done/plan-cweijan-issues-497-cross-page-table.md) |
| [#503](https://github.com/cweijan/vscode-office/issues/503) | [markdown/test-markdown-cweijan-503-wsl-export-chromium.md](markdown/test-markdown-cweijan-503-wsl-export-chromium.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-503-wsl-export-chromium.md) |
| [#529](https://github.com/cweijan/vscode-office/issues/529) | [word/test-word-cweijan-529-toc-blank.docx](word/test-word-cweijan-529-toc-blank.docx) | [issue_529_toc_blank.py](_generate-script/issue_529_toc_blank.py) | [plan](../docs/plans/done/plan-cweijan-issues-529-toc-blank.md) |
| [#570](https://github.com/cweijan/vscode-office/issues/570) | [markdown/test-markdown-cweijan-570-scroll-jump-to-top.md](markdown/test-markdown-cweijan-570-scroll-jump-to-top.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-570-scroll-jump-to-top.md) |
| [#571](https://github.com/cweijan/vscode-office/issues/571) | [markdown/test-markdown-cweijan-571-codeblock-line-spacing.md](markdown/test-markdown-cweijan-571-codeblock-line-spacing.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-571-codeblock-line-spacing.md) |
| [#575](https://github.com/cweijan/vscode-office/issues/575) | [markdown/test-markdown-cweijan-575-table-width-adapt.md](markdown/test-markdown-cweijan-575-table-width-adapt.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-575-table-width-adapt.md) |
| [#576](https://github.com/cweijan/vscode-office/issues/576) | [excel/test-excel-cweijan-576-sheets-undefined.xlsx](excel/test-excel-cweijan-576-sheets-undefined.xlsx) | [issue_576_sheets_undefined.py](_generate-script/issue_576_sheets_undefined.py) | [plan](../docs/plans/done/plan-cweijan-issues-576-sheets-undefined.md) |
| [#587](https://github.com/cweijan/vscode-office/issues/587) | [markdown/test-markdown-cweijan-587-local-image-regression.md](markdown/test-markdown-cweijan-587-local-image-regression.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-587-local-image-regression.md) |
| [#589](https://github.com/cweijan/vscode-office/issues/589) | [markdown/test-markdown-cweijan-589-large-file-slow-load.md](markdown/test-markdown-cweijan-589-large-file-slow-load.md) | [issue_589_large_file_slow_load.py](_generate-script/issue_589_large_file_slow_load.py) | [plan](../docs/plans/todo/plan-cweijan-issues-589-large-file-slow-load.md) |
| [#590](https://github.com/cweijan/vscode-office/issues/590) | [markdown/test-markdown-cweijan-590-heading-list-number.md](markdown/test-markdown-cweijan-590-heading-list-number.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-590-heading-list-number.md) |
| [#592](https://github.com/cweijan/vscode-office/issues/592) | [excel/test-excel-cweijan-592-formula-percent-nan.xlsx](excel/test-excel-cweijan-592-formula-percent-nan.xlsx) | [issue_592_formula_percent_nan.py](_generate-script/issue_592_formula_percent_nan.py) | [plan](../docs/plans/done/plan-cweijan-issues-592-formula-percent-nan.md) |
| [#593](https://github.com/cweijan/vscode-office/issues/593) | [pdf/test-pdf-cweijan-593-link-navigation.pdf](pdf/test-pdf-cweijan-593-link-navigation.pdf) | [issue_593_link_navigation.mjs](_generate-script/issue_593_link_navigation.mjs) | [plan](../docs/plans/done/plan-cweijan-issues-593-link-navigation.md) |
| [#596](https://github.com/cweijan/vscode-office/issues/596) | [markdown/test-markdown-cweijan-596-md-silent-rewrite.md](markdown/test-markdown-cweijan-596-md-silent-rewrite.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-596-md-silent-rewrite.md) |
| [#598](https://github.com/cweijan/vscode-office/issues/598) | [markdown/test-markdown-cweijan-598-table-math-formula.md](markdown/test-markdown-cweijan-598-table-math-formula.md) | - | [plan](../docs/plans/todo/plan-cweijan-issues-598-table-math-formula.md) |
| [#599](https://github.com/cweijan/vscode-office/issues/599) | [markdown/test-markdown-cweijan-599-search-result-jump.md](markdown/test-markdown-cweijan-599-search-result-jump.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-599-search-result-jump.md) |
| [#601](https://github.com/cweijan/vscode-office/issues/601) | [markdown/test-markdown-cweijan-601-trailing-blank-lines.md](markdown/test-markdown-cweijan-601-trailing-blank-lines.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-601-trailing-blank-lines.md) |
| [#603](https://github.com/cweijan/vscode-office/issues/603) | [markdown/test-markdown-cweijan-603-blank-pdf-docx-export.md](markdown/test-markdown-cweijan-603-blank-pdf-docx-export.md) | - | [plan](../docs/plans/done/plan-cweijan-issues-603-blank-pdf-docx-export.md) |
| [#604](https://github.com/cweijan/vscode-office/issues/604) | [excel/test-excel-cweijan-604-nested-if-crash.xlsx](excel/test-excel-cweijan-604-nested-if-crash.xlsx) | [issue_604_nested_if_crash.py](_generate-script/issue_604_nested_if_crash.py) | [plan](../docs/plans/done/plan-cweijan-issues-604-nested-if-crash.md) |
| [#607](https://github.com/cweijan/vscode-office/issues/607) | [excel/test-excel-cweijan-607-missing-dimension.xlsx](excel/test-excel-cweijan-607-missing-dimension.xlsx) / [test-excel-cweijan-607-x-prefixed-ns.xlsx](excel/test-excel-cweijan-607-x-prefixed-ns.xlsx) | [issue_607_missing_dimension.py](_generate-script/issue_607_missing_dimension.py) | [plan](../docs/plans/done/plan-cweijan-issues-607-missing-dimension.md) |
| [#597](https://github.com/cweijan/vscode-office/issues/597) | [word/issue-597-toc.docx](word/issue-597-toc.docx) / [issue-597-toc-plain.docx](word/issue-597-toc-plain.docx) | [issue_597_toc.py](_generate-script/issue_597_toc.py) / [issue_597_variants.py](_generate-script/issue_597_variants.py) | [plan](../docs/plans/done/plan-cweijan-issues-597-word-toc.md) |

注: #239 的 csv 约 11MB(12 万行,脚本内 `ROWS` 可调);#589 的 md 约 5MB(脚本内 `TARGET_MB` 可调,`--append` 模拟边写边开);#529 的文档兼作 597 补丁的回归用例。

## 重新生成

全部文件由脚本生成,可随时重建:

```bash
python test-workspace/_generate-script/generate.py   # Excel/Word/PPT/图片/TIFF/ICNS/Java class
node   test-workspace/_generate-script/generate.mjs  # PDF/PSD/Parquet/EPUB/XMind/压缩包/xls/ods/字体
python test-workspace/_generate-script/verify.py     # 结构与解码验证
node   test-workspace/_generate-script/verify.mjs
```

issue 复现文件按 `issue_{编号}_{slug}.py/.mjs` 单独成脚本(见上表「生成脚本」列),
`test-{格式}-cweijan-*` 命名的产物均由对应脚本单独重建,不随 generate.py 全量重生成。

依赖: 项目 `node_modules`(pdf-lib、SheetJS、jszip、tar、7z-wasm、hyparquet-writer 等)与
Python 侧的 Pillow、openpyxl、python-docx、python-pptx。

生成脚本、渲染 harness(`render*/`)集中在 `_generate-script/`;issue 处理过程的临时
验证脚本与构建残留归档于 [_tmp/](_tmp/)(详见各目录内 README)。

## 已知限制

- `sample.xlsm`: openpyxl 无法从零创建 VBA 工程,该文件是合法 xlsx 包结构(无宏),用于测试 xlsm 扩展名路由与解析。
- `sample.pdf`: pdf-lib 标准字体(WinAnsi)不含 CJK,未嵌入中文字体;中文渲染需真实 PDF 样本。
- `sample.crx`: CRX2 头 + zip 数据,公钥/签名为占位字节,仅测试容器解析。
- `sample.apk` / `sample.jar`: 为 zip 结构占位(含典型条目名),不包含有效 DEX/字节码。
- `heif/`、`archive/sample.rar`: 无法在本地生成有效样本,获取方式见各目录 README。
