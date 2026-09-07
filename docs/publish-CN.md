# 发布指南

如何打包 **Office Viewer Enhance**（`maizhuoying.vscode-office-enhance`）并发布到 VS Code Marketplace，以及可选发布到 Open VSX。

> 若日后恢复遥测，另请参阅 [telemetry-CN.md](telemetry-CN.md)（已弃用/存档）。

## 1. 创建 publisher

1. 使用 Microsoft 账号登录 [Marketplace 管理页](https://marketplace.visualstudio.com/manage)。
2. 创建 ID 为 **`maizhuoying`** 的 publisher —— 必须与 `package.json` 中的 `"publisher"` 完全一致。
3. 扩展 ID 随即为 `maizhuoying.vscode-office-enhance`。

## 2. 创建个人访问令牌（PAT）—— 仅命令行发布需要

若通过网页上传发布（见下方方式 A），可跳过本节。

1. 登录 [Azure DevOps](https://dev.azure.com) → 右上角用户图标 → **Personal Access Tokens**
2. **New Token**：
   - Organization：**All accessible organizations**
   - Scopes：**Custom defined → Marketplace → Manage**
3. 复制令牌 —— **只显示一次**。默认有效期 30 天，过期后重新创建并重新登录。

## 3. 本地打包与验证

```bash
npm run lint:fix     # 保持代码整洁
npm run build        # 生产构建（桌面版 + Web 版扩展 + webview + vditor）
npm run package      # 生成 vscode-office-enhance-<版本号>.vsix
```

发布前，建议本地安装 `.vsix`（扩展面板 → `···` → **从 VSIX 安装**），完整冒烟测试主要查看器（含公式的 `.xlsx`、`.pdf`、`.md`、`.zip`）。

> npm scripts 中已带 `--no-dependencies`：跳过 vsce 的 node_modules 完整性检查，该检查与 pnpm 安装的依赖结构不兼容。

## 4. 发布

两种等效方式 —— 最终上传的都是同一个 `.vsix`：

### 方式 A —— 网页手动上传（无需 PAT）

1. 执行 `npm run package` 生成 `.vsix`
2. 打开 [Marketplace 管理页](https://marketplace.visualstudio.com/manage/publishers/maizhuoying) → **New extension** → **Visual Studio Code** → 上传该 `.vsix`
3. 若扩展列表中显示为 **Private**，点其 `···` 菜单选择 **Make Public**

适合偶尔发版。每次上传仍要求更高的 `version`。

### 方式 B —— 命令行发布（`vsce publish`，需要第 2 节的 PAT）

```bash
npx vsce login maizhuoying     # 按提示粘贴 PAT
npx vsce publish --no-dependencies
```

`vscode:prepublish` 钩子会在打包前自动执行 `npm run build`。

发布后几分钟，市场页面生效：
`https://marketplace.visualstudio.com/items?itemName=maizhuoying.vscode-office-enhance`

## 5. 版本号规则

- 每次发布的版本号必须**高于**市场上的当前版本。
- 让 vsce 自动升版本（同时会提交 git 并打 tag）：
  - `npx vsce publish --no-dependencies` → patch 位 +1
  - `npx vsce publish --no-dependencies minor` / `major`
- 或自行修改 `package.json` 的 `"version"`，再执行 `npx vsce publish --no-dependencies <版本号>`。

## 6. 发布到 Open VSX（可选）

Open VSX 是 VSCodium 等 VS Code 衍生版使用的扩展注册表。

1. 使用 GitHub 账号登录 [open-vsx.org](https://open-vsx.org)
2. Settings → **Access Tokens** → 生成令牌
3. 发布上面生成的 `.vsix`：

```bash
npx ovsx publish vscode-office-enhance-<版本号>.vsix -p <令牌>
```

## 故障排查

| 问题 | 解决 |
|---------|-----|
| 发布时报 `401` / 认证错误 | PAT 过期或权限不对 —— 重新创建（**Marketplace → Manage**），再 `npx vsce login maizhuoying` |
| 版本被拒绝 | 该版本已存在于市场 —— 升高 `version` |
| 发布时构建失败 | 先本地跑 `npm run build` 修复错误 |
| publisher 不匹配 | `package.json` 的 `"publisher"` 必须与市场 publisher ID 完全一致 |
| 市场 README 图片失效 | 确认 README 引用的文件（如 `image/...`）存在于仓库中 |
| 与上游原版扩展共存 | 本 fork 已使用 `maizhuoying.*` viewType，两个扩展可同时安装；打开文件时 VS Code 会询问使用哪个编辑器 |

## 相关文档

- [telemetry-CN.md](telemetry-CN.md) — 遥测配置（已弃用，存档）
