# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Office Viewer(vscode-office)是一个 VS Code 扩展,在 VS Code 内预览/编辑 Office 文件(Excel、Word、PowerPoint)、PDF、EPUB、Markdown(WYSIWYG)、HTML,并内置 HTTP Client、Git History、压缩包查看器、Java 反编译等功能。同时发布为桌面扩展(Node 扩展宿主)和 Web 扩展(vscode.dev)。

## 常用命令

```bash
npm run dev        # 桌面扩展开发模式(esbuild watch + vite dev server),随后 F5 选 "Extension" 调试
npm run dev:web    # Web 扩展开发模式,调试配置选 "Extension (Web)"
npm run build      # 生产构建(清空并输出到 out/)
npm run package    # vsce 打包 .vsix
npm run lint:fix   # ESLint 检查并自动修复
```

- 无测试框架,没有测试命令。
- dev 模式下 webview 从 vite dev server(`http://127.0.0.1:5739`)加载,React 代码改动即时生效;扩展宿主代码由 esbuild watch 输出到 `out/extension.js`。

## 架构

### 四个构建单元,由一个 vite 命令编排

所有 npm scripts 都通过 `vite` 启动([vite.config.ts](vite.config.ts)),它负责:

1. **React webview**(vite):`src/react/` → `out/webview/`,webview 侧单页应用。
2. **扩展宿主**(esbuild,[build.ts](build.ts),由 vite.config.ts 动态 import 触发):
   - 桌面版:`src/extension.ts` → `out/extension.js`(CJS,node platform)
   - Web 版:`src/extension.web.ts` → `out/extension.web.js`(CJS,browser platform;Node 内置模块通过 [src/shims/](src/shims/) 和 build.ts 的 node-shim 插件替换)
   - 生产构建另将 5 个重依赖(vscode-html-to-docx、highlight.js、pdf-lib、katex、puppeteer-core,见 build.ts 的 `dependencies`)单独 bundle 到 `out/node_modules`,构建时标记为 external
3. **vditor 子项目**([vite/vditorPlugin.ts](vite/vditorPlugin.ts)):`vditor/` 是独立的 vite 库项目(fork 的 Markdown 编辑器),dev 时由 chokidar watch `vditor/src` 触发重建,prod 时在 closeBundle 阶段构建;产物(UMD)自动复制到 `resource/markdown/dist/`。

桌面构建还会把 `template/**`、`unrar.wasm`、`7zz.wasm` 复制进 `out/`。

### 扩展宿主 → webview 的数据流

1. `package.json` 的 `customEditors` 按文件名模式分发到各 Provider(`maizhuoying.officeViewer`、`maizhuoying.markdownViewer`、`maizhuoying.archiveViewer` 等)。
2. Provider(如 [officeViewerProvider.ts](src/provider/officeViewerProvider.ts))根据文件后缀决定 `route`(excel/word/ppt/font/epub/psd/xmind/parquet/…),调用 `ReactApp.view(webview, { route })`。
3. `ReactApp`([src/common/reactApp.ts](src/common/reactApp.ts))加载 webview HTML,把 route、语言、用户配置等 JSON 注入到 HTML 的 `{{configs}}` 占位符。
4. webview 入口 [src/react/main.tsx](src/react/main.tsx) 通过 `getConfigs()` 读取 configs,按 `route` 渲染对应的 lazy-loaded 组件(`src/react/view/<name>/`)。

例外:PDF 走独立的 pdf.js 查看器(`resource/pdf/viewer.html`),Markdown 走 vditor(`resource/markdown/index.html`),都不经过 React。

### 宿主与 webview 的消息通信

[Handler](src/common/handler.ts)(`Handler.bind(panel, uri)`)封装 postMessage:宿主 `handler.on(event, cb)` / `handler.emit(event, content)`,并自动挂接文件监听(`fileChange`、`externalUpdate`、`dispose`)。webview 侧对应逻辑在 `src/react/util/vscode.ts`。

### Desktop / Web 平台差异

- Web 入口不注册:HTTP Client、Git History、剪贴板贴图、Java 反编译、压缩包查看器(由 WebUnsupportedViewerProvider 兜底)。
- 运行时判断:`isWebExtensionHost()`([src/common/extensionHost.ts](src/common/extensionHost.ts));`package.json` 命令/菜单用 `office.extensionHost.web` context key 控制 enablement。

### 新增一种文件类型查看器

1. `package.json` → `customEditors` 增加文件名 selector。
2. [officeViewerProvider.ts](src/provider/officeViewerProvider.ts) 的 switch 中把后缀映射到新 `route`。
3. `src/react/view/<name>/` 新建组件,并在 [src/react/main.tsx](src/react/main.tsx) 增加 lazy import 与 route 分支。
4. 打开时可调用 `TelemetryService.trackOfficeViewOpen`(本 fork 已禁用遥测,该方法为 no-op,保留接口便于日后恢复)。

## 文档结构(docs/)

- `plans/`: 计划与处理方案,命名规范见 [docs/plans/agent.md](docs/plans/agent.md) —— issue 处理类 `plan-cweijan-issues-{编号}-{主题}.md`(上游) / `plan-my-issues-{编号}-{主题}.md`(本仓库),其他 `plan-{主题}.md`
- `issues/cweijan-issues/`: 上游 issue 跟踪。`sync_issues.py` **只同步上游 open issue**(gh 优先,REST API 兜底)生成 `issues.xlsx`(人工维护处理状态/关联 plan/备注三列,脚本不覆盖;已登记 issue 被上游关闭时更新"上游状态"并保留该行,历史 closed 不主动拉取)与 `ISSUES.md` 只读快照(README 引用);`--init {编号} {slug}` 生成 `plan-cweijan-issues-{编号}-{主题}.md` 骨架并回填关联列
- `faq/`、`dev/`、`release/`、`archive/`: 常见使用问题、开发指南、发布步骤、弃用存档(均双语,`-CN` 后缀,繁体 README 引用 CN 版)

## 代码约定

- 宿主代码使用路径别名 `@/*` → `src/*`(tsconfig paths,esbuild 原生解析)。
- ESLint(flat config):`unused-imports/no-unused-imports` 为 error,提交前运行 `npm run lint:fix`;`no-explicit-any` 已关闭,TypeScript 为非 strict 模式。
- 静态资源(pdf.js、markdown webview、java-decompiler.jar、sponsor 图片)统一放 `resource/`,通过 `extensionResource` / `readExtensionText`([src/common/extensionResource.ts](src/common/extensionResource.ts))读取,不要硬编码路径。
- webview 内用户可见文案需加入 i18n:`src/react/i18n/messages/`(11 种语言);扩展宿主侧用 `src/common/vscode-nls-i18n`。

## Git 提交规范

涉及 issue 的代码改动,用 `feat(xxx)` / `fix(xxx)`,**scope 中体现 issue 来源与编号**:

- 上游(cweijan)issue:`fix(cweijan-597): ...`、`feat(cweijan-592): ...`
- 本仓库 issue:`fix(my-12): ...`
- 需同时体现功能模块时逗号并列(模块在前):`fix(word,cweijan-597): ...`
- 标题用中文简述改动;同一 issue 的处理过程可多笔提交,scope 保持一致
- 不涉及 issue 的普通改动沿用模块 scope(`fix(markdown): ...`)或无 scope;纯文档/依赖/构建类用 `chore:` / `docs:`

