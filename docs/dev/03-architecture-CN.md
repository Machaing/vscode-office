# 架构

本文描述扩展宿主与 webview 的协作方式;构建体系另见 [04-build-CN.md](04-build-CN.md)。

## 扩展宿主到 webview 的数据流

1. `package.json` 的 `customEditors` 按文件名模式分发到各 Provider(`maizhuoying.officeViewer`、`maizhuoying.markdownViewer`、`maizhuoying.archiveViewer` 等)。
2. Provider(如 [officeViewerProvider.ts](../../src/provider/officeViewerProvider.ts))根据文件后缀决定 `route`(excel/word/ppt/font/epub/psd/xmind/parquet/…),调用 `ReactApp.view(webview, { route })`。
3. `ReactApp`([reactApp.ts](../../src/common/reactApp.ts))加载 webview HTML,把 route、语言、用户配置等 JSON 注入到 HTML 的 `{{configs}}` 占位符。
4. webview 入口 [main.tsx](../../src/react/main.tsx) 通过 `getConfigs()` 读取 configs,按 `route` 渲染对应的懒加载组件([src/react/view/<name>/](../../src/react/view/))。

例外:PDF 走独立的 pdf.js 查看器(`resource/pdf/viewer.html`),Markdown 走 vditor(`resource/markdown/index.html`),都不经过 React。

## 宿主与 webview 的消息通信

[Handler](../../src/common/handler.ts)(`Handler.bind(panel, uri)`)封装 postMessage:宿主侧 `handler.on(event, cb)` / `handler.emit(event, content)`,并自动挂接文件监听(`fileChange`、`externalUpdate`、`dispose`)。webview 侧的对应封装是 [vscode.ts](../../src/react/util/vscode.ts) 导出的 `handler`,同样是 `on` / `emit` 两个方法,消息体统一为 `{ type, content }`。

## Desktop / Web 平台差异

- Web 入口([extension.web.ts](../../src/extension.web.ts))不注册:HTTP Client、Git History、剪贴板贴图、Java 反编译、压缩包查看器,这些文件类型由 [webUnsupportedViewerProvider.ts](../../src/provider/webUnsupportedViewerProvider.ts) 兜底。
- 运行时判断用 `isWebExtensionHost()`([extensionHost.ts](../../src/common/extensionHost.ts));`package.json` 里的命令与菜单用 `office.extensionHost.web` context key 控制 enablement。

## 新增一种文件类型查看器

1. `package.json` → `customEditors` 增加文件名 selector。
2. [officeViewerProvider.ts](../../src/provider/officeViewerProvider.ts) 的 switch 中把后缀映射到新 `route`。
3. `src/react/view/<name>/` 新建组件,并在 [main.tsx](../../src/react/main.tsx) 增加 lazy import 与 route 分支。
4. 打开时可调用 `TelemetryService.trackOfficeViewOpen`(本 fork 已禁用遥测,该方法为 no-op,保留接口便于日后恢复)。

## 相关文档

- 构建体系见 [04-build-CN.md](04-build-CN.md),工程目录结构见 [02-structure-CN.md](02-structure-CN.md)。
- 开发调试与打包的上手步骤见 [01-development-CN.md](01-development-CN.md)。


