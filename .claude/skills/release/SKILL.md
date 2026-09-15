---
name: release
description: 为本项目（Office Viewer Enhance）发布新版本：给定 x.x.x 版本号，校验并更新 package.json、依据 git log 与既有格式起草 CHANGELOG.md 条目（用户确认后写入）、依次执行 lint:fix → build → package 编译打包出 .vsix。当用户提到发版、发布/升级新版本、打新包、编译某个版本、生成 changelog、出 vsix 时使用本 skill；即使用户只说了简短的『发个 4.2.1』『打包新版本』也应触发。
---

# 发布新版本（release）

输入一个版本号（如 `4.2.1`），完成：版本校验 → 收集变更 → CHANGELOG 起草 → 版本写入 → 编译打包。最终产物是 `release/vscode-office-enhance-<版本号>.vsix`。

**本 skill 不执行发布上传**（vsce publish / 网页上传 / git commit / git tag），只在结尾提醒后续步骤。完整发布文档：[docs/release/publish-CN.md](../../../docs/release/publish-CN.md)。

## 第 1 步：解析并校验版本号

1. 从用户输入或 $ARGUMENTS 中提取 `x.y.z` 形式的版本号。
2. 用户没给版本号时，先看第 2 步收集到的变更再建议（只有 fix → patch，有 feat/新功能 → minor），用 AskUserQuestion 让用户确认，**不要自行决定版本号**。
3. 校验，任一不满足就指出问题并请用户重新给出，不要继续往下走：
   - 符合 semver（`\d+\.\d+\.\d+`，允许 `-beta.1` 之类后缀）；
   - 大于 package.json 顶层 `"version"` 的当前值（逐段数值比较——Marketplace 会拒绝重复或更低的版本号）。
4. 同时读 CHANGELOG.md 顶部的最新版本条目（形如 `# 4.2.0 2026-8-16`），它应与 package.json 的 version 一致；不一致说明版本状态异常（例如有人手动改过一半），先向用户报告再继续。

## 第 2 步：收集本次变更（git log）

本仓库**没有 git tag**，基线按 CHANGELOG 顶部的上一版本确定：

1. 取 CHANGELOG.md 最新条目的版本号与日期（如 `4.2.0` / `2026-8-16`）。
2. 执行 `git log --since="<该日期>" --pretty=format:"%h %ad %s" --date=short` 列出其后的提交（git 接受不补零的日期）。
3. `--since` 按自然日过滤，发版当天的提交既可能已随上一版发布、也可能属于新版——起草时把这些"边界提交"单独标出，让用户在第 3 步一并取舍。

## 第 3 步：起草 CHANGELOG 条目并让用户确认

CHANGELOG 的 4.x 惯例（沿用文件顶部既有条目的风格）：

- 标题行 `# <版本号> <今天日期>`，日期**不补零**：写 `2026-9-13` 而不是 `2026-09-13`。
- 正文为**英文**，按模块分组；组名独占一行以冒号结尾，条目为 `- ` 列表。
- 模块名来自 commit 的 scope 映射：`markdown`→Markdown Editor、`word`→Word、`excel`→Excel、`pdf`→PDF、`ppt`→PowerPoint、`git`→Git History、`epub`→EPUB、`svg`→SVG、`xmind`→XMind；无 scope 的按内容归入对应模块，或使用顶层 `Fix:` / `Update:` 分组。
- 提交信息是中文，条目要**翻译成简洁英文**，动词开头（如 `修复 TOC 目录条目文本丢失` → `Fix TOC entry text loss.`）。
- `chore:`、`docs:` 及纯内部重构默认**不写入** CHANGELOG，但在草稿末尾附上"已忽略的提交"清单，供用户捞回。

把完整草稿直接展示在回复里，等用户确认或提出修改后再进入第 4 步。用户要求改动时改完再展示一次。

## 第 4 步：写入版本变更

1. package.json：仅修改顶层 `"version"` 为新版本号，其他内容不动。
2. CHANGELOG.md：在文件头 `# Change log` 之后、上一版本条目之前插入确认后的条目（保持一个空行分隔）。

## 第 5 步：编译打包

按顺序执行，**任一步失败就停下报告错误**，不要继续：

```bash
npm run lint:fix
npm run build
npm run package
```

- `build` 是多单元生产构建（React webview + 桌面/Web 扩展宿主 + vditor 子项目），耗时较长，Bash 调用给足 timeout（≥600000ms）。
- `vsce package` 会经 `vscode:prepublish` 钩子再跑一次 build，属预期行为（与 [docs/release/publish-CN.md](../../../docs/release/publish-CN.md) 第 3 节流程一致）。
- 打包完成后确认产物 `release/vscode-office-enhance-<版本号>.vsix` 存在。

## 第 6 步：收尾报告

汇报三件事：新版本号、写入 CHANGELOG 的条目摘要、产物 .vsix 的完整路径。然后提醒后续动作（详见 docs/release/publish-CN.md）：

- 建议先本地安装 .vsix 冒烟测试（含公式的 `.xlsx`、`.pdf`、`.md`、`.zip`）；
- 发布方式 A：Marketplace 管理页网页上传 .vsix（无需 PAT）；
- 发布方式 B：`npx vsce publish --no-dependencies`（需 PAT）；
- git commit / tag 由用户自行决定，本 skill 不代做。
