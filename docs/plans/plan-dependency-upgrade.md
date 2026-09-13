# 上游核心依赖升级计划

> 创建: 2026-09-12 · 本文档跟踪扩展所依赖的上游核心组件的版本状态、升级记录与后续计划。
> 后续每次依赖升级后更新本文档。

## 一、上游核心组件清单

按查看器功能划分,扩展的运行时核心依赖如下:

| 功能 | 组件 | 维护方 |
| --- | --- | --- |
| Word 查看/编辑 | `@eigenpal/docx-editor-react` + `@eigenpal/docx-editor-core` | eigenpal |
| Excel 查看/编辑 | `@cweijan/exceljs`、`xlsx`(SheetJS)、`udsv`(CSV 渲染) | cweijan / SheetJS |
| PPT 查看 | `pptxviewjs` | 社区 |
| PDF 查看 | pdf.js(内嵌 `resource/pdf/`)、`pdf-lib`(生成/写入) | Mozilla / pdf-lib |
| EPUB | `epubjs` | futurepress |
| Markdown 编辑 | `vditor/`(fork 内嵌子项目,自行维护) | 本仓库 |
| 公式渲染 | `katex` | KaTeX |
| 图表 | `mermaid` | mermaid-js |
| PSD | `ag-psd` | Agamnentzar |
| 字体 | `opentype.js` | opentype.js |
| XMind | `mind-elixir` + `@mind-elixir/import-xmind` | sschneebly 等 |
| Parquet | `hyparquet` + `hyparquet-writer` | hyparam |
| 压缩包 | `@zip.js/zip.js`、`jszip`、`tar`、`7z-wasm`、`node-unrar-js` | 各上游 |
| 文件类型识别/编码 | `file-type`、`iconv-lite` | sindresorhus / ashtuchkin |
| Webview UI 框架 | `react`、`react-dom`、`antd`、`@ant-design/icons` | Meta / 蚂蚁 |

## 二、版本状态梳理(2026-09-12)

### 已是最新(无需处理)

| 组件 | 版本 | 说明 |
| --- | --- | --- |
| `@eigenpal/docx-editor-react` / `-core` / `-agents` / `-i18n` | 1.9.0 | **已打本地补丁**,见下文 |
| `@cweijan/exceljs` | 5.0.2 | |
| `pptxviewjs` | 1.1.9 | |
| `epubjs` | 0.3.93 | |
| `pdf-lib` | 1.11.2 | |
| `7z-wasm` | 1.2.0 | |
| `node-unrar-js` | 2.0.2 | |
| `@mind-elixir/import-xmind` | 1.0.8 | |
| `utif` / `heic2any` / `mustache` / `tar` | — | 无更新 |
| `vscode-html-to-docx` / `puppeteer-core` / `highlight.js` | — | 无更新(markdown 导出链路) |

### 本轮已升级(2026-09-12,均为向后兼容范围)

| 组件 | 旧 → 新 | 升级收益 |
| --- | --- | --- |
| `react` / `react-dom` | 19.2.8 → 19.3.0 | Webview 框架最新稳定版,获得 19.3 的性能修复与稳定性改进 |
| `ag-psd` | 30.2.0 → 31.0.2 | PSD 解析修复与新增图层属性支持,提升 PSD 查看器兼容性 |
| `@zip.js/zip.js` | 2.11.2 → 2.14.0 | 压缩包查看器的 zip 读写修复(条目名编码/分卷等) |
| `katex` | 0.16.47 → 0.18.7 | 公式渲染修复与新的宏/符号支持,markdown 导出 PDF 的公式更准 |
| `udsv` | 0.5.3 → 0.7.3 | CSV 解析/渲染修复(分隔符、引号边界、性能) |
| `hyparquet` / `hyparquet-writer` | 1.30.0 → 1.30.1 / 0.15.7 → 0.16.9 | Parquet 读取修复与 schema 推断改进 |
| `jszip` | 3.10.1 → 3.10.2 | 修复补丁 |
| `iconv-lite` | 0.6.3 → 0.7.3 | 编码检测(GB18030 等)修复 |
| `codemirror-lang-latex` | 0.4.2 → 0.6.1 | Markdown 内 LaTeX 代码高亮改进 |
| `yaml` | 2.9.0 → 2.9.1 | 修复补丁 |
| `vite`(dev) | 8.2.2 → 8.3.0 | 构建工具链更新 |
| `@typescript-eslint/*`(dev) | 8.69 → 8.70 | lint 规则修复 |
| `@types/react` / `-dom` / `vscode` / `diff-match-patch`(dev) | — | 类型定义同步 |

**升级后验证**: `npm run build` ✓、`npm run lint:fix` ✓(仅 1 个既有无关警告)、
全部测试文档重生成+解析验证 26 项 ✓、issue-597 双变体无头渲染回归 ✓。

### 暂缓升级(major 版本,建议专项处理)

| 组件 | 当前 → 最新 | 暂缓原因 / 风险 | 建议时机 |
| --- | --- | --- | --- |
| `antd` / `@ant-design/icons` | 5.29 → 6.x / 5.6 → 6.x | antd 6 为 UI 框架大版本,全部 webview 组件受影响,需专项迁移与视觉回归 | antd 6 稳定数个 minor 后,单开分支处理 |
| `mermaid` | 11.17 → 12.0 | 12.0 刚发布,vditor 的 mermaid 主题集成与配置兼容性未知 | 12.x 出 2-3 个补丁后 |
| `opentype.js` | 1.3.4 → 2.0.0 | 2.0 为 TypeScript 重写版,`fontViewerMain.ts` 的 `opentype.parse` API 需验证 | 空 viewport 测试数据齐全后 |
| `file-type` | 19.6 → 22.1 | 跨 3 个 major,ESM-only 化倾向,扩展宿主 CJS 加载需验证 | 与 Node 升级一起评估 |
| `react-image-gallery` | 1.4 → 2.1 | 图片查看器画廊交互组件,major 重写 | 需手动回归图片画廊功能 |
| `markdown-it` + 插件 | 14.3 → 15.0 | **src/ 无直接 import**(疑为 vditor 构建期/历史遗留依赖),先评估能否从 dependencies 移除 | 移除评估优先于升级 |
| `node-html-parser` | 7.1 → 9.0 | 同上,无直接引用 | 同上 |
| `eslint`(dev) | 9.39 → 10.10 | 工具链 major,flat config 兼容性需验证 | 单独提交 |
| `mind-elixir` | 5.15 → 6.0.0-next.4 | **预发布版本**,不升级 | 6.0 正式版发布后 |
| `@vscode/codicons` | 0.0.45 → 0.0.46-24 | 预发布版本,不升级 | 正式版发布后 |

## 三、issue-597 本地补丁与上游升级的联动

`@eigenpal/docx-editor-core@1.9.0` 通过 `pnpm patch` 携带本地修复(嵌套域/TOC 文本丢失,
详见 [plan-cweijan-issues-597-word-toc.md](plan-cweijan-issues-597-word-toc.md)):

- 补丁文件: [patches/@eigenpal__docx-editor-core.patch](../../patches/@eigenpal__docx-editor-core.patch)
- 配置: [pnpm-workspace.yaml](../../pnpm-workspace.yaml) 的 `patchedDependencies`
- **升级该依赖前必须**: 检查上游 changelog 是否已包含等效修复;
  - 已修复 → 移除补丁与 `patchedDependencies`,直接升级;
  - 未修复 → 用 `test-workspace/_generate/apply_597_patch.py` 的锚点在新版本上重新生成补丁
    (锚点基于压缩产物,上游重构后需人工适配),并以 `issue-597-toc*.docx` 双变体做渲染回归。

## 四、验证基线

任何依赖升级后执行:

```bash
npm run build                 # 编译
npm run lint:fix              # 静态检查
python test-workspace/_generate/generate.py && node test-workspace/_generate/generate.mjs
python test-workspace/_generate/verify.py && node test-workspace/_generate/verify.mjs
# 手动: F5 后抽查 test-workspace/ 各格式查看器; word 用 issue-597 双变体回归 TOC
```
