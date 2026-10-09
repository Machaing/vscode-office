# Build System

The development and build commands (`npm run dev`, `npm run dev:web`, `npm run build`) are all orchestrated by a single vite command defined in [vite.config.ts](../../vite.config.ts): besides building the webview itself, vite dynamically imports [build.ts](../../build.ts) at startup to build the extension host with esbuild, and drives the vditor subproject through a plugin. So when investigating build issues, look at `vite.config.ts` for the webview, `build.ts` for the extension host, and [vite/vditorPlugin.ts](../../vite/vditorPlugin.ts) for vditor.

## The four build units

1. **React webview** (vite): `src/react/` → `out/webview/`, the webview SPA; viewer components are lazy-loaded per `route`.
2. **Desktop extension host** (esbuild): `src/extension.ts` → `out/extension.js` (CJS, node platform).
3. **Web extension host** (esbuild): `src/extension.web.ts` → `out/extension.web.js` (CJS, browser platform). Node built-in modules and some dependencies are replaced with browser-compatible implementations or empty stubs via [src/shims/](../../src/shims/) and the node-shim plugin in build.ts.
4. **vditor subproject** ([vite/vditorPlugin.ts](../../vite/vditorPlugin.ts)): `vditor/` is a standalone vite library project (a forked Markdown editor); its UMD output is copied to `resource/markdown/dist/`. In dev mode, chokidar watches `vditor/src` and triggers rebuilds; in production it is built during the closeBundle phase.

Five heavy dependencies (vscode-html-to-docx, highlight.js, pdf-lib, katex, puppeteer-core — see `dependencies` in build.ts) are marked external when building the extension hosts, so they are not bundled into `extension.js`. A production build first bundles them separately into `out/node_modules`, then builds the extension hosts — `.vscodeignore` excludes `node_modules/`, so the vsix ships no dependency directory and these packages are distributed as bundles under `out/`.

## dev vs build

- A production build (`npm run build`) wipes `out/` first, builds both the desktop and web hosts, and performs the separate bundling described above.
- In dev mode, the `OFFICE_EXTENSION_TARGET` environment variable decides which host to watch — only one at a time: `npm run dev` leaves it unset and watches the desktop host; `npm run dev:web` sets it to `web` and watches the web host.
- Desktop builds (dev and prod alike) copy `template/**`, `unrar.wasm`, and `7zz.wasm` into `out/` (see `createDesktopAssetCopyPlugins` in build.ts).

## See also

- For getting started with development and packaging, see [01-development.md](01-development.md).
- For publishing, see [../release/publish.md](../release/publish.md).
