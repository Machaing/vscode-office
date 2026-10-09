# 构建体系

开发与构建命令(`npm run dev`、`npm run dev:web`、`npm run build`)都由 [vite.config.ts](../../vite.config.ts) 一条 vite 命令编排:vite 除了构建 webview 本身,启动时还会动态 import [build.ts](../../build.ts),用 esbuild 构建扩展宿主,并通过插件驱动 vditor 子项目。因此排查构建问题时,webview 相关看 `vite.config.ts`,扩展宿主相关看 `build.ts`,vditor 相关看 [vite/vditorPlugin.ts](../../vite/vditorPlugin.ts)。

## 四个构建单元

1. **React webview**(vite):`src/react/` → `out/webview/`,webview 侧单页应用,按 `route` 懒加载各查看器组件。
2. **桌面扩展宿主**(esbuild):`src/extension.ts` → `out/extension.js`(CJS,node platform)。
3. **Web 扩展宿主**(esbuild):`src/extension.web.ts` → `out/extension.web.js`(CJS,browser platform)。Node 内置模块与部分依赖通过 [src/shims/](../../src/shims/) 和 build.ts 的 node-shim 插件替换为浏览器可用的实现或空占位文件。
4. **vditor 子项目**([vite/vditorPlugin.ts](../../vite/vditorPlugin.ts)):`vditor/` 是独立的 vite 库项目(fork 的 Markdown 编辑器),产物(UMD)自动复制到 `resource/markdown/dist/`。dev 时由 chokidar 监听 `vditor/src` 触发重建;prod 时在 closeBundle 阶段构建。

扩展宿主构建时,5 个重依赖(vscode-html-to-docx、highlight.js、pdf-lib、katex、puppeteer-core,见 build.ts 的 `dependencies`)标记为 external,不打进 `extension.js`。生产构建会先把它们单独 bundle 到 `out/node_modules`,再构建扩展宿主 —— `.vscodeignore` 排除了 `node_modules/`,vsix 不携带依赖目录,这些包以 bundle 后的形式随产物分发。

## dev 与 build 的差异

- 生产构建(`npm run build`)开始时清空 `out/`,桌面、Web 两个宿主都会构建,并执行上述重依赖的单独 bundle。
- dev 模式由环境变量 `OFFICE_EXTENSION_TARGET` 决定 watch 哪个宿主,一次只 watch 一个:`npm run dev` 不设置该变量,watch 桌面版;`npm run dev:web` 将其设为 `web`,watch Web 版。
- 桌面构建(dev 与 prod 均如此)会把 `template/**`、`unrar.wasm`、`7zz.wasm` 复制进 `out/`(见 build.ts 的 `createDesktopAssetCopyPlugins`)。

## 相关文档

- 开发调试与打包的上手步骤见 [01-development-CN.md](01-development-CN.md)。
- 发布流程见 [../release/publish-CN.md](../release/publish-CN.md)。
