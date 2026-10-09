# 工程结构

本仓库是一个 VS Code 扩展加一个编辑器子项目的组合。本文先用目录树给出整体面貌,再用表格对核心目录详细说明;为避免第一棵树递归太深,`src/` 与 `resource/` 的内部结构在后文各自章节进一步展开。构建如何把这些目录串起来见 [04-build-CN.md](04-build-CN.md),运行时的宿主与 webview 协作见 [03-architecture-CN.md](03-architecture-CN.md)。

## 目录总览

```text
vscode-office/
├── src/                # 扩展源码(宿主侧 + webview 侧),见「src/ 源码树」
├── vditor/             # fork 的 Markdown 编辑器子项目,独立 vite 库项目
├── resource/           # 随扩展分发的运行时静态资源,见「resource/ 资源树」
├── public/             # vite public 目录,内容原样拷入 webview 产物根(字体查看器的 woff2 解压脚本)
├── icons/              # 文件图标主题的 SVG 图标
├── theme/              # 文件图标主题清单(material-icons.json)
├── syntaxes/           # HTTP、Kotlin、Kusto、Nginx、Reg、TOML 的语法高亮与语言配置
├── snippets/           # HTTP Client 代码片段
├── template/           # 文档导出模板
├── lib/                # 剪贴板贴图按平台调用的系统脚本(PowerShell、AppleScript、shell)
├── patches/            # pnpm 依赖补丁,挂在 pnpm-workspace.yaml 的 patchedDependencies
├── docs/               # 项目文档,见「核心目录详解」
├── test/               # 性能验证脚本(仓库无自动化测试框架)
├── test-workspace/     # issue 复现文件工作区,可重新生成的大文件不入库
├── image/              # README 等文档用图片
├── out/                # 构建产物(git 忽略)
├── release/            # vsix 打包输出(git 忽略)
├── .github/            # CI workflow(推 tag 自动构建发布)与 issue 模板
├── vite.config.ts      # 构建编排入口,所有 npm scripts 由此启动
├── build.ts            # 扩展宿主的 esbuild 构建脚本
├── vite/               # vite 插件(vditorPlugin.ts)
├── index.html          # webview 的 vite HTML 入口,含 {{configs}} 占位符
├── package.json        # 命令与 customEditors 注册
├── package.nls.*.json  # 命令文案的多语言本地化
├── tsconfig.json       # TypeScript 配置,含路径别名 @/* → src/*
├── eslint.config.mjs   # ESLint flat config
├── pnpm-workspace.yaml # pnpm 工作区配置(依赖补丁挂载点)
├── telemetry.json      # 遥测事件声明(本 fork 已禁用上报)
├── .vscodeignore       # vsix 打包排除清单(node_modules、src、docs 等不进包)
├── README.md           # 项目说明;另有 changelog.md 更新日志,均带 -CN 中文版
└── CLAUDE.md           # Claude Code 工作指引
```

## 核心目录详解

| 目录 | 说明 |
|------|------|
| `src/` | 扩展全部源码,按宿主侧与 webview 侧分层:入口为 `extension.ts`(桌面)与 `extension.web.ts`(Web);`common/` 是宿主侧基础设施,`provider/` 承接 customEditors 的分发,`react/` 是 webview 单页应用,`service/` 是宿主侧业务服务,`shims/` 在 Web 构建时替换 Node 内置模块。展开见「src/ 源码树」。 |
| `vditor/` | fork 自 Vditor 的 Markdown 编辑器,自成一体(独立 package.json、vite.config.ts、src/),构建产物 UMD 复制到 `resource/markdown/dist/` 供 Markdown webview 使用,构建触发方式见 [04-build-CN.md](04-build-CN.md)。 |
| `resource/` | 随扩展分发的运行时资源,统一经 `extensionResource` / `readExtensionText` 读取,不要硬编码路径。展开见「resource/ 资源树」。 |
| `docs/` | `plans/`(issue 处理方案,命名与归档规范见其 agent.md)、`issues/`(上游与本仓库 issue 跟踪)、`faq/`、`dev/`(本文所在)、`release/`、`archive/`。 |
| `test/`、`test-workspace/` | 性能验证脚本;issue 复现文件工作区,复现文件按 issue 编号组织,可重新生成的大体积文件被 git 忽略。 |
| `out/`、`release/` | `out/` 是构建产物(webview、扩展宿主、bundled 依赖与资源),`release/` 是 vsce 打包出的 vsix,两者均被 git 忽略。 |

## src/ 源码树

```text
src/
├── extension.ts        # 桌面扩展宿主入口
├── extension.web.ts    # Web 扩展宿主入口(vscode.dev),与桌面版差异见 03-architecture-CN.md
├── common/             # 宿主侧基础设施
│   ├── handler.ts                   # 宿主与 webview 的消息通信封装
│   ├── reactApp.ts                  # webview HTML 加载与 {{configs}} 配置注入
│   ├── extensionHost.ts             # isWebExtensionHost() 平台判断
│   ├── extensionResource.ts         # 扩展资源读取
│   ├── fileUtil.ts 等               # 文件与通用工具
│   └── vscode-nls-i18n/             # 宿主侧 i18n
├── provider/           # customEditors 各查看器的 Provider
│   ├── officeViewerProvider.ts      # 按文件后缀分发 route(excel、word、ppt 等)
│   ├── markdownEditorProvider.ts    # Markdown 编辑器(vditor)
│   ├── archiveViewerProvider.ts     # 压缩包查看器
│   ├── classViewerProvider.ts       # Java 反编译
│   ├── webUnsupportedViewerProvider.ts  # Web 版不支持类型的兜底提示
│   └── compress/ http/ xml/ yaml/ handlers/  # 对应查看器的宿主侧实现
├── react/              # webview 单页应用
│   ├── main.tsx        # 入口,按 route 渲染 view/ 下组件
│   ├── view/           # 各文件类型查看器组件(excel、word、powerpoint、psd、xmind、epub、parquet、fontViewer、compress、svg、image、icns、gitHistory 等)
│   ├── i18n/           # webview 文案(messages/ 下 11 种语言)
│   ├── util/           # vscode.ts(消息通信的 webview 侧封装)等工具
│   └── shims/ polyfills/   # 浏览器兼容垫片
├── service/            # 宿主侧业务服务
│   ├── markdownService.ts    # Markdown 导出 PDF/DOCX、剪贴板贴图
│   ├── compress/ zip/        # 压缩包查看与解压
│   ├── parquet/ icon/ ai/    # 对应功能的服务
│   └── telemetryService.ts   # 遥测(本 fork 已禁用,方法为 no-op)
├── gitHistory/         # Git History 视图(仅桌面版)
├── shims/              # Web 扩展构建时替换 Node 内置模块与 puppeteer-core 等依赖的 shim
└── types/              # 无类型声明第三方库的 .d.ts(heic2any、utif)
```

## resource/ 资源树

```text
resource/
├── pdf/                # pdf.js 查看器(viewer.html、pdf.js、worker、字体与 cmaps)
├── markdown/           # vditor webview:index.html 与配套脚本,dist/ 为 vditor 构建产物
├── lib/
│   └── vscode.js       # 供非 React webview(PDF、Markdown)使用的 postMessage 封装
└── java-decompiler.jar # Java 反编译器
```

## 相关文档

- 开发调试与打包的上手步骤见 [01-development-CN.md](01-development-CN.md)。
- 运行时的宿主与 webview 协作见 [03-architecture-CN.md](03-architecture-CN.md)。
- 构建体系见 [04-build-CN.md](04-build-CN.md)。
