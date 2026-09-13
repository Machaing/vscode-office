# 开发指南

## 环境要求

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.64+

## 快速开始

```bash
git clone https://github.com/Machaing/vscode-office.git
cd vscode-office
npm install
```

## 开发调试

**桌面扩展**（完整功能）:

```bash
npm run dev
```

在 VS Code 中按 `F5`，或在"运行和调试"中选择 **Extension**。

webview 侧 React 应用由 vite dev server（`http://127.0.0.1:5739`）提供，`src/react/` 下的改动即时热更新；扩展宿主代码（`out/extension.js`）由 esbuild watch 重新编译，需在扩展开发宿主窗口按 `Ctrl+R` 重载后生效。

**Web 扩展**（浏览器中的 Markdown、HTML、YAML）:

```bash
npm run dev:web
```

在"运行和调试"中选择 **Extension (Web)**。

## 构建与打包

```bash
npm run build    # 生产构建
npm run package  # 生成 .vsix
```

## 发布

参阅 [docs/release/publish-CN.md](../release/publish-CN.md) 了解发布到 VS Code Marketplace 与 Open VSX 的步骤。
