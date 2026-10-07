# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/394

## 标题

[BUG] Upload image broken if top-level GIT folder

## 标签

bug(报告者 noltedennis,创建于 2025-03-10,当前 open)

## 问题描述-原文

- OS: Windows 11
- Extension Version: v3.5.0

I tend to place all my checked out repositories in one folder and open that folder in VS Code, like

- c:/Users/myuser/repos/repo1
- c:/Users/myuser/repos/repo2

Each repository contains a docs folder (since we often use mkdocs). When I open a markdown file with the extension and attempt to upload an image, I get the error:
"ENOENT: no such file or directory, open 'c:\Users\myuser\repos\repo1\docs\image\index\1741622430698.png'"

If I open either repository folder instead of their parent folder, the extension behaves as expected.

## 问题评论信息

无评论。

## 问题描述-中文

- 操作系统: Windows 11;扩展版本: v3.5.0;
- 「我习惯把所有检出的仓库放在同一个文件夹里,并用 VS Code 打开那个文件夹」,例如:
  - `c:/Users/myuser/repos/repo1`
  - `c:/Users/myuser/repos/repo2`
- 「每个仓库都包含一个 docs 文件夹(因为我们常用 mkdocs)。当我用本扩展打开一个 markdown 文件并尝试上传图片时,得到报错:
  `"ENOENT: no such file or directory, open 'c:\Users\myuser\repos\repo1\docs\image\index\1741622430698.png'"`」;
- 「如果我打开的是任意一个仓库文件夹本身、而不是它们的父文件夹,扩展就表现正常」。

## 问题评论信息-中文

无。

## 补充归纳(非原文)

以下为本仓库分析归纳,非 issue 原文:

- 用户工作区布局: VS Code 打开的是多个 git 仓库的**父目录**(`repos/`),markdown 位于各仓库的 `docs` 下;
- 报错路径 `docs\image\index\<时间戳>.png` 与默认图片规则 `image/${fileName}/${now}.${ext}` 按 md 文件(`docs/index.md`,故 `${fileName}` = `index`)相对其所在目录展开的结果一致,说明路径模板已正常展开,但目标文件的父目录在该工作区布局下未被成功创建/解析,写入时父目录不存在导致 ENOENT。

## 期望行为

无论 VS Code 打开的是仓库本身还是包含多个 git 仓库的父目录,粘贴/上传的图片都应按 `vscode-office.pasterImgPath` 规则成功保存到 md 所在目录的相对路径(自动创建父目录)并插入图片引用(按原文「直接打开仓库文件夹时表现正常」反推)。

## 实际行为

工作区根目录为多个 git 仓库的父目录时,在 markdown 中上传/粘贴图片失败,报 ENOENT(目标父目录不存在);直接打开仓库文件夹时同样操作正常。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-394-image-upload-path.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 mkdocs 风格 Markdown 载体(含标题、一段正文、一个既有图片引用),复现时复制到 `仓库/docs/index.md` 使用 —— 文件名 `index` 与 issue 报错路径中的 `docs\image\index\` 对应(默认规则 `image/${fileName}/${now}.${ext}` 展开结果)。

### 复现步骤

1. 构造 issue 描述的目录结构(任意位置,如 `%TEMP%/issue-394/`):

   ```
   issue-394/                <- VS Code 打开的工作区(父目录)
   ├── repo1/                <- git init 过的仓库
   │   └── docs/
   │       └── index.md      <- 复制复现文件内容到此
   └── repo2/                <- 再放一个仓库,匹配"多仓库共父目录"场景
   ```

2. F5 调起扩展调试,在开发扩展宿主中「文件 → 打开文件夹」打开 `issue-394` 父目录(保持默认 `vscode-office.pasterImgPath` = `image/${fileName}/${now}.${ext}`);
3. 打开 `repo1/docs/index.md`,复制一张图片后在正文中 Ctrl+V 粘贴;
4. 预期: 图片保存为 `repo1/docs/image/index/<时间戳>.png`(父目录自动创建)并插入引用;实际: 报 ENOENT,与 issue 现象一致;
5. 对照: 「文件 → 打开文件夹」改为直接打开 `repo1`,重复步骤 3,验证是否恢复正常(对应 issue 中"直接打开仓库文件夹正常"的对照结论)。

## 根因定位

**已定位(版本时点定位到 v3.5.0 的缺失 mkdir;现行代码已修复),布局相关性为推断。**

### 1. 报错版本(v3.5.0)的代码:粘贴链路完全没有创建父目录

issue 报错对应上游 v3.5.0(本地历史 `788e5ef`,2025-01-14)。该版本 webview 粘贴/上传图片走
`markdownEditorProvider.on("img")`(该提交下 `src/provider/markdownEditorProvider.ts:100-107`):

```ts
const { relPath, fullPath } = adjustImgPath(uri)
const imagePath = isAbsolute(fullPath) ? fullPath : `${resolve(uri.fsPath, "..")}/${relPath}`.replace(/\\/g, "/");
writeFileSync(imagePath, Buffer.from(img, 'binary'))
```

- 报错路径 `c:\...\repo1\docs\image\index\1741622430698.png` 与默认模板 `image/${fileName}/${now}.png`
  (v3.5.0 package.json 默认值,png 硬编码)按 md 文件所在目录展开的结果完全一致,证明走的是
  `fullPath` 非绝对的相对分支;
- `writeFileSync` 之前**没有任何 mkdir**。当时 [fileUtil.ts](../../../src/common/fileUtil.ts) 里存在一个
  会递归建目录的 `writeFile`(existsSync + `mkdirSync(dir, { recursive: true })`),但 img 处理器只 import
  未使用,直接用了裸 `writeFileSync`;
- 因此只要 `docs/image/index/` 目录链不存在,`fs.open` 直接抛
  `ENOENT: no such file or directory, open '...'`,与 issue 报错逐字吻合。3.4.x 同样如此(核对
  `24f1cf7`/`7aabca9`,代码相同)。

### 2. 为什么「直接打开仓库正常」——路径计算与工作区无关,差异只能来自流程/环境(推断)

- 失败分支的路径计算是**纯 md 文件相对**的:`resolve(uri.fsPath, "..") + relPath`,
  [getWorkspacePath](../../../src/common/fileUtil.ts#L49-L61) 与 workspaceFolders 在默认模板下
  (不含 `${workspaceDir}`)完全不参与 → 「打开父目录 vs 打开仓库」两种布局算出的目标路径**相同**,
  可以排除路径计算/工作区边界导致差异;
- v3.5.0 同时存在**第二条粘贴链路**:[markdownService.ts 的 loadClipboardImage](../../../src/service/markdownService.ts#L123-L146)
  (普通文本编辑器内粘贴时触发),它调用 [createImgDir](../../../src/service/markdownService.ts#L187-L192)
  做 `mkdirSync(dir, { recursive: true })`,不会 ENOENT。VS Code 的 `*.md` 默认编辑器选择
  (`workbench.editorAssociations`)是**按工作区生效**的(仓库内 `.vscode/settings.json` 可覆盖用户级配置,
  mkdocs 仓库常有仓库级配置)→ 推断报告者「打开仓库正常」时实际走的是文本编辑器粘贴链路(有 mkdir),
  「打开父目录失败」时走的是 webview 自定义编辑器链路(无 mkdir);
- 备选解释:直接打开仓库测试时目标目录 `docs/image/index/` 恰好已存在(此前手动/工具创建过)。
  两种解释都基于同一结论:报错本身只由「无 mkdir」造成。

### 3. 修复时间线与现行代码状态

- 上游 `ac374ed`(2026-06-24,v4.0.5,"Migrate node.js to vscode.workspace.fs")把 img/insertImage 处理器
  改为 `ensureParentDirectory(imageUri)` + `vscode.workspace.fs.writeFile`,本 issue 的根因自此消除;
- `1bfe034`(2026-07-09,v4.1.5)抽取为 [saveImageAndBuildMarkdown](../../../src/provider/markdownEditorProvider.ts#L539-L555):
  L545 计算 md 相对路径,L546-L547 `ensureParentDirectory` 递归建父目录,L551 写文件,
  [imgExtGuide](../../../src/service/markdownService.ts#L163-L171) 再按真实文件类型纠正扩展名;
- [ensureParentDirectory](../../../src/common/workspaceFs.ts#L12-L19) 逐级 stat + 递归
  `vscode.workspace.fs.createDirectory`(磁盘 Provider 本身即 mkdirp 语义),能创建任意深度的缺失目录链,
  且与工作区布局无关(目标路径始终相对 md 文件)。

### 4. 顺带发现(与工作区边界相关,非本 issue 必需)

- [getWorkspacePath](../../../src/common/fileUtil.ts#L53-L60) 多根工作区匹配用的是
  `uri.fsPath.includes(folder.uri.fsPath)` 子串匹配,`e:\repo` 会误匹配 `e:\repo2\x.md`,
  影响 `${workspaceDir}` 模板与 `pasteImageToWorkspacePath` 在多根/嵌套目录下的取根,属潜在相邻缺陷;
- 工作区中 [fileUtil.ts](../../../src/common/fileUtil.ts) 的未提交改动已提交为 `dd69599`
  (cweijan-308,模板变量改为 g 标志正则 + 函数式替换)。该改动只影响占位符多次出现的替换行为,
  不改变本 issue 的路径语义;现行 `adjustImgPath`([fileUtil.ts:12-42](../../../src/common/fileUtil.ts#L12-L42))
  默认配置(`pasteImageToWorkspacePath=false`)下仍返回 md 相对路径,行为与修复结论一致。

## 修复方案

**无需修复(已由上游 v4.0.5 `ac374ed` 修复,现行 `saveImageAndBuildMarkdown` + `ensureParentDirectory` 链路完整)。**
本 plan 仅做验证确认后归档。

可选加固(非必须,不实施):

1. [adjustImgPath](../../../src/common/fileUtil.ts#L12-L42) 与宿主侧可考虑给
   `getWorkspacePath` 的多根匹配换成「按路径段前缀」判断,消除 `e:\repo` 误匹配 `e:\repo2` 的隐患
   (影响面:`${workspaceDir}` 模板、`pasteImageToWorkspacePath`、`workspaceBaseUrl` 注入);
2. 若未来出现 ENOENT 复发,优先检查新增的图片写入调用是否统一走了
   `saveImageAndBuildMarkdown` / [writeFile](../../../src/common/fileUtil.ts#L6-L10)
   (两条入口都含父目录创建),避免再次绕过。

## 验证方式

对应上方「复现步骤」逐条(当前版本 4.2.2,F5 调试扩展宿主):

1. 步骤 1-3(父目录布局 + 粘贴):预期图片成功保存为
   `issue-394/repo1/docs/image/index/<时间戳>.png`——`docs/image/index/` 整条目录链被自动创建,
   **不再出现 ENOENT** 报错,正文插入 `![index](image/index/xxx.png)` 引用并立即渲染;
2. 步骤 4 对照(直接打开 `repo1` 再粘贴):预期同样成功,且保存路径与步骤 3 完全一致
   (验证路径计算与工作区布局无关的结论);
3. 深目录链回归:把 `pasterImgPath` 设为 `a/b/c/${fileName}/${now}.${ext}` 再粘贴,
   预期三级目录一次性创建成功;
4. 模板/配置回归:
   - `pasterImgPath` 含 `${workspaceDir}`(父目录布局):预期保存到 `issue-394/image/...`(父目录根),
     插入引用后可渲染(经 e0c132b 的工作区绝对路径重写);
   - `pasteImageToWorkspacePath=true`:预期 `relPath` 为 `/image/...` 工作区绝对形式且预览正常;
   - 恢复默认配置粘贴一次,确认默认行为未变;
5. 上传链路回归:右键/工具栏「Insert Image」选择本地图片文件,预期与粘贴走同一
   `saveImageAndBuildMarkdown` 链路,同样自动建目录;
6. 文件完好性:保存 md 后磁盘引用路径、`imgExtGuide` 的扩展名纠正(用 GIF 伪命名 .png 测)均符合预期。
