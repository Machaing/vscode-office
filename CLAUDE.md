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

构建编排见 [docs/dev/04-build-CN.md](docs/dev/04-build-CN.md);宿主与 webview 的数据流与消息通信、平台差异、新增文件类型查看器的步骤见 [docs/dev/03-architecture-CN.md](docs/dev/03-architecture-CN.md);工程目录结构见 [docs/dev/02-structure-CN.md](docs/dev/02-structure-CN.md)。

## 文档结构(docs/)

- `plans/`: 计划与处理方案,命名与行文规范见 [docs/plans/agent.md](docs/plans/agent.md) —— issue 处理类 `plan-cweijan-issues-{编号}-{主题}.md`(上游) / `plan-my-issues-{编号}-{主题}.md`(本仓库),其他 `plan-{主题}.md`;新建 plan 落 `todo/`,根因定位且修复验证通过(或确认无需修复)后按 agent.md「完成归档」流程移入 `done/`(git mv + 同步 issues.xlsx 状态/关联路径、ISSUES.md 快照行、test-workspace 登记表链接、plan 内相对链接)
- `issues/cweijan-issues/`: 上游 issue 跟踪。`sync_issues.py` **只同步上游 open issue**(gh 优先,REST API 兜底)生成 `issues.xlsx`(人工维护处理状态/关联 plan/备注三列,脚本不覆盖;已登记 issue 被上游关闭时更新"上游状态"并保留该行,历史 closed 不主动拉取)与 `ISSUES.md` 只读快照(README 引用);`--init {编号} {slug}` 生成 `plan-cweijan-issues-{编号}-{主题}.md` 骨架并回填关联列
- `faq/`、`dev/`、`release/`、`archive/`: 常见使用问题、开发指南、发布步骤、弃用存档(均双语,`-CN` 后缀;README 与 changelog 的中英版本均在根目录,中文版经 explorer.fileNesting 折叠于英文版下)

## 代码约定

- 宿主代码使用路径别名 `@/*` → `src/*`(tsconfig paths,esbuild 原生解析)。
- ESLint(flat config):`unused-imports/no-unused-imports` 为 error,提交前运行 `npm run lint:fix`;`no-explicit-any` 已关闭,TypeScript 为非 strict 模式。
- 静态资源(pdf.js、markdown webview、java-decompiler.jar、sponsor 图片)统一放 `resource/`,通过 `extensionResource` / `readExtensionText`([src/common/extensionResource.ts](src/common/extensionResource.ts))读取,不要硬编码路径。
- webview 内用户可见文案需加入 i18n:`src/react/i18n/messages/`(11 种语言);扩展宿主侧用 `src/common/vscode-nls-i18n`。
- 中文文档(plan、README、changelog、FAQ)用通顺的叙述性中文:冒号只用于引导列表/表格/引文,不以无谓语的名词短语直接冒号接完整句;行文标点用中文全角(逗号/分号/冒号/括号,反引号与链接内、`file.ts:123` 类记号除外);英文术语首次出现加中文注释;不用翻译腔黑话(prepend/defer/workaround 之类),代码链路写成有主谓的句子而非箭头堆砌。plan「问题确认及解决」章节生成后按 [agent.md](docs/plans/agent.md) 的「行文自查清单」通读检查。

## Git 提交规范

涉及 issue 的代码改动,用 `feat(xxx)` / `fix(xxx)`,**scope 中体现 issue 来源与编号**:

- 上游(cweijan)issue:`fix(cweijan-597): ...`、`feat(cweijan-592): ...`
- 本仓库 issue:`fix(my-12): ...`
- 需同时体现功能模块时逗号并列(模块在前):`fix(word,cweijan-597): ...`
- 标题用中文简述改动;同一 issue 的处理过程可多笔提交,scope 保持一致
- 不涉及 issue 的普通改动沿用模块 scope(`fix(markdown): ...`)或无 scope;纯文档/依赖/构建类用 `chore:` / `docs:`

