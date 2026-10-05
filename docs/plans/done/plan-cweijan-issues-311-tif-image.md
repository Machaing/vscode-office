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

Word 预览图片链路(@eigenpal/docx-editor 内部,dist 反查确认):

1. **media 提取**: 解析 zip 时把 `word/media/*` 原样收入 media Map(`word/media/image2.tiff` → ArrayBuffer);
2. **dataUrl 生成**: 按扩展名映射 MIME(`tif/tiff → image/tiff`),将字节 base64 拼成 `data:image/tiff;base64,...`;
3. **blip 解析**: `w:drawing → a:blip r:embed` 经 `document.xml.rels` 解析到 Target `media/image2.tiff`,取上述 dataUrl 作为 image 节点的 `src`;
4. **渲染**: ProseMirror image 节点 `toDOM` 直接输出 `<img src="data:image/tiff;base64,...">`。

失败点在第 4 步的浏览器侧: Chromium/WebKit 的 `<img>` 原生不支持 TIFF 解码,该 `<img>` 进入 broken 状态(`naturalWidth=0`,`drawImage` 抛 `InvalidStateError: broken state`),只留白色占位框;解析期不报错,所以文档其余部分正常。与 image/tiff 单图路由的问题本质相同,但 Word 路由没有走 `src/react/view/image/convertImage.ts` 的 utif 转换。

## 修复方案

选择**方案 a(本仓库侧预处理)**,不动 docx-editor 依赖(其 React props 无图片解析 hook,方案 b 需给库内引入 utif 依赖,侵入更大):

- 新增 `src/react/view/word/tiffMedia.ts` 的 `convertDocxTiffMedia(buffer)`: 文档 buffer 进入 `DocxEditor` 前重写 docx zip 包——
  1. 先对原始字节做一次 latin1 快速扫描(仅匹配 `media/xxx.tif(f)` 痕迹,zip 中央目录条目名未压缩),无 TIFF 时零成本原样返回,TOC 等普通文档不受影响;
  2. 有 TIFF 时 JSZip 解包,`word/media/*.tif(f)` 用 utif 解码(多页 TIFF 仅取首页 IFD)→ canvas → PNG;
  3. 条目重命名(`image2.tiff → image2.png`,冲突时追加 `_1/_2`),同步改写所有 `*.rels` 的 `Target="media/xxx.tiff"`,并在 `[Content_Types].xml` 缺省时补 `<Default Extension="png">`;
  4. `zip.file(..., { createFolders: false })` 避免隐式生成源包中不存在的目录条目(JSZip 默认会创建,且 `zip.remove` 对目录节点是递归删除,不可事后清理);解码失败/非法包则原样返回,退化为既有行为。
- `Word.tsx` 的 `loadDocument` 中 `loadOfficeBuffer` 之后接入该转换(2 行改动)。
- 复用既有依赖 jszip(webview excel/xmind 已在用)与 utif(image 路由已在用),无新增依赖;utif 被打成 webview 共享 chunk。

**已知限制**:

- 多页 TIFF 仅显示首页(utif 只解码 ifds[0],与 issue 单页诉求一致);
- 文档经编辑后保存时,原 TIFF 媒体以 PNG 形式写回(编辑器基于转换后的模型保存),媒体体积可能变化(复现文件 307KB 未压缩 TIFF → 25KB PNG);
- `word/media/` 子目录嵌套的 tiff(实际 Word 产物不存在此形态)不在处理范围,维持原行为。

## 修复记录(2026-09-14)

- 新增 `src/react/view/word/tiffMedia.ts`(convertDocxTiffMedia + mayContainTiffMedia + decodeTiffToPng)。
- 修改 `src/react/view/word/Word.tsx`: `setDocumentBuffer(await convertDocxTiffMedia(buffer))`。
- 验证工具: `test-workspace/_generate/render311/`(无头渲染 harness,`?convert=1` 直接 import 仓库内 `tiffMedia.ts` 验证真实代码;`?dump=1` 导出转换后 zip 供结构校验),变体文件 `test-311-no-png-default.docx`(剥除 png Content_Types 声明)、`test-311-multipage-tiff.docx`(2 页 TIFF)。
- 未改 docx-editor 依赖与 patches/,未引入新依赖。

## 验证方式

无头 Chrome(DevTools MCP)+ 真实 `DocxEditor` 管线,esbuild bundle 静态服务加载(与 render529 同套路):

```bash
npx esbuild test-workspace/_generate/render311/main.jsx --bundle --format=iife \
  --outfile=test-workspace/_generate/render311/bundle.js --jsx=automatic \
  --platform=browser --define:process.env.NODE_ENV='"production"'
cd test-workspace && python -m http.server 8791 --bind 127.0.0.1
# 浏览器打开(渲染完成 title 变 RENDER_DONE, 结果在 window.__RESULT__):
#  修复前: /_generate/render311/index.html?file=word/test-word-cweijan-311-tif-image.docx
#  修复后: 同 URL 加 &convert=1
# 判定: 文档两张 img 中 TIFF 那张 naturalWidth>0 且 canvas drawImage 可绘制
```

2026-09-14 实测结果:

- **修复前**: PNG 图 `data:image/png`、320x320 正常;TIFF 图 `data:image/tiff`、`naturalWidth=0`,`drawImage` 抛 `broken state`,即空白(截图 `render-311-before.png`);
- **修复后**: 两张图均为 `data:image/png`、320x320、canvas 像素级可绘制(91204/91204 非透明像素,与 PNG 对照图同内容)(截图 `render-311-fixed.png`);
- **转换后 zip 结构**: 19 个条目与源包一致、无多余目录条目;`image2.tiff → image2.png`(合法 PNG,25,602B);`rId10` Target 改指 `media/image2.png`;png Default 声明按需补齐(tiff 声明保留);
- **变体**: 无 png Default 声明的 docx 转换后可正常渲染(补声明分支生效);2 页 TIFF 转换后显示第 1 页(红色页,非第 2 页蓝色),符合"仅首页"限制;
- **回归(597/529)**: 经 convert 路径渲染 `issue-597-toc.docx`(hyperlink 版,5 条目+链接)、`issue-597-toc-plain.docx`(5 条目)、`test-word-cweijan-529-toc-blank.docx`(6 条目+页码)均完整无回归;且这些文档无 TIFF 媒体,快速扫描直接返回原 buffer,渲染路径零改动;
- `npx eslint src/react/view/word/tiffMedia.ts src/react/view/word/Word.tsx` 通过;`npm run build` 生产构建通过,`out/webview/assets/Word-*.js` 含转换逻辑,utif 进入共享 chunk `UTIF-*.js`。
