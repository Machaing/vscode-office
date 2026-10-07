# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/405

## 标题

[BUG] placeholder instead of image in markdown viewer

## 标签

bug(报告者 kyell182,创建于 2025-05-01,当前 open)

## 问题描述-原文

- OS: windows 11
- Extension Version: 3.5.4

when i want to see the preview it gives the place holder of images but wont render them  in markdown-viewer

while other previewers do show the image 

## 问题评论信息

无评论。

## 问题描述-中文

- 操作系统: windows 11;扩展版本: 3.5.4;
- 「当我想查看预览时,它给出的是图片的占位符,而不在 markdown-viewer 中渲染它们」;
- 「而其他预览器能显示图片」。

## 问题评论信息-中文

无。

## 补充归纳(非原文)

以下为本仓库分析归纳,非 issue 原文:

- 正文无截图、无 markdown 样例,「占位符」的具体形态与图片引用形式无法从原文得知;
- 「其他预览器」未指明是哪一个(如 VS Code 内置 Markdown 预览或其他扩展);
- issue 无评论,维护者尚未回复。

## 期望行为

markdown viewer 预览时应将图片引用渲染为实际图像,与其他预览器的表现一致(推断,正文未明写)。

## 实际行为

预览中图片仅显示占位符,不渲染出图像内容(正文无截图)。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-405-image-placeholder.md`
生成脚本: 文本文件,直接维护

文件内容说明: 构造两类图片引用各一处 —— 本地相对路径图片(`../image/sample.png`,文件真实存在)
与外链图片(Wikimedia 上的 Markdown 标志 SVG),另附一行对照文本。与 issue 现象的对应关系:
打开预览后观察这两类图片是渲染出实际图像,还是仅显示占位符。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 查看预览中的两张图片;
3. 预期: 本地相对路径图片与外链图片均正常渲染;实际: 显示占位符、不渲染(issue 现象)。
   可再用 VS Code 内置 Markdown 预览打开同一文件对照,内置预览正常而扩展异常即可确认。

## 根因定位

**部分定位(主因为高置信推断):「占位符」即图片加载失败后的浏览器碎图/alt 展示,主因指向
工作区绝对路径(`/img/x.png`)类图片引用在 v3.5.4 完全没有解析支持——该缺口直到 15 个月后的
`e0c132b`(2026-08-12)才补上;issue 未附图片语法,无法 100% 定名。**

### 1. 「占位符」是什么(已从代码确认,非 vditor 专用控件)

- v3.5.4(本地历史 `875385e`,2025-04-28)的 webview 用上游打包的
  `vscode-vditor@3.8.19`(resource/vditor/vditor.js)。反查该 dist:markdown 图片渲染为普通
  `<img alt="'+alt+'" src="'+src+'">`,不存在图片懒加载、错误占位、`data-src` 换载等机制
  (dist 中与图片相关的 `IntersectionObserver` 命中均为大纲/代码块懒渲染,7 处 `placeholder`
  命中均为输入框/空文档占位属性);
- 现行 fork 同理:[setLute.ts:24-26](../../../vditor/src/ts/markdown/setLute.ts#L24-L26) 仅在
  `lazyLoadImage` 配置存在时才启用 Lute 图片懒加载,而 [resource/markdown/index.js](../../../resource/markdown/index.js)
  的 Vditor 初始化未设置该选项;
- 现行 fork 的 [editorCommonEvent.ts `markImageLoading`](../../../vditor/src/ts/util/editorCommonEvent.ts)
  (上游 `cc8a1e5`,2026-06-22)只是给加载中的 img 加 `data-loading` 微光样式,load/error 均会移除;
- → 结论:用户看到的「placeholder」= `<img>` 加载失败后浏览器呈现的碎图图标/alt 文本框。

### 2. v3.5.4 的图片加载链路(代码证据)

- 本地相对路径:唯一依赖 [resource/markdown/index.html:10](../../../resource/markdown/index.html#L10)
  的 `<base href="{{baseUrl}}/">`,`baseUrl = webview.asWebviewUri(folderPath 或 workspace)`
  (v3.5.4 markdownEditorProvider.ts 的 `handleMarkdown` 尾部,含 `.replace(/\?.+$/,'')` 与
  `.replace('https://git','https://file')` 两个 hack,与现行
  [markdownEditorProvider.ts:366-368](../../../src/provider/markdownEditorProvider.ts#L366-L368) 一致);
- `localResourceRoots` = `[vscode.Uri.file("/"), A:/..Z:/]`(桌面 Windows 覆盖所有盘符);
- 外链 https:绝对 URL 不受 base 影响,直接由 webview 网络栈加载。

### 3. 主因(高置信推断):工作区绝对路径 `/img/x.png` 在 v3.5.4 是解析空洞

- `![](/images/foo.png)` 这类以 `/` 开头的引用,在 `<base href=".../docs/">` 下被解析为
  `https://.../docs/images/foo.png`(相对 md 所在目录)→ 404 → 碎图占位;
- 而 VS Code 内置 Markdown 预览**按工作区根**解析 `/images/foo.png` → 正常显示,
  与 issue 的「其他 previewer 能显示」精确吻合;
- 该能力缺口在代码上可证:v3.5.4 的 webview 里对 `/` 开头 src **没有任何重写逻辑**
  (唯一的 imageParser 仅在 `viewAbsoluteLocal=true` 时处理 `file:///` 形式,见下)。
  直到 `e0c132b`(2026-08-12,v4.1.7)才引入 [imagePath.js](../../../resource/markdown/imagePath.js):
  [isWorkspaceAbsoluteImagePath](../../../resource/markdown/imagePath.js#L3-L5) 识别 `/` 开头 src,
  [rewriteWorkspaceAbsoluteImages](../../../resource/markdown/imagePath.js#L12-L25) 用宿主下发的
  `workspaceBaseUrl`([markdownEditorProvider.ts:218](../../../src/provider/markdownEditorProvider.ts#L218))重写。
  该提交的存在本身即证明此前的空洞期。

### 4. 已排除/降级的次要候选

- **远程/SSH/web 环境**:v3.5.4 的 localResourceRoots 不含 folderPath 与 workspaceFolders,
  远程scheme(`vscode-remote://`)图片会被服务工作者拒绝——上游 `e4817ab`(2026-06-27,v4.0.7,
  PR #491 名即 "fix-remote-markdown-images")证明此类问题真实存在;但报告者环境为 Windows 11 桌面,
  降级为次要候选。现行 roots 已含全部所需项([markdownEditorProvider.ts:140-147](../../../src/provider/markdownEditorProvider.ts#L140-L147));
- **`file:///` 绝对路径 src**:webview(https 源)加载 file: 子资源被浏览器拦截,v3.5.4 需
  `viewAbsoluteLocal=true`(默认 false)触发 imageParser 改写才能显示——若报告者 markdown 用的是
  绝对本地路径形式,现象同样吻合。此形态至今(含现行版本)仍是空洞(与 issue 587 主因同源,
  见 plan-cweijan-issues-587);
- **纯外链场景**:外链加载与 base 无关,内置预览能显示则本扩展同样能显示 → 基本排除
  「外链全部裂图」的解读;若个别外链因网络/代理失败,则与扩展无关,无法从代码定位。

### 5. 无法完全确定的部分

issue 正文无截图、无 markdown 样例、无配置信息,「占位符」对应的具体引用形式
(工作区绝对路径 / file 绝对路径 / 其他)无法定名;上述第 3 节为与全部已知现象吻合度最高的解释。

## 修复方案

**现行代码(4.2.2)已覆盖主因与远程场景,本 issue 对应版本无需再改:**

1. 相对路径:`<base href>` 链路保留;
2. 工作区绝对路径:`e0c132b` 引入的 imagePath.js + workspaceBaseUrl 重写(含 MutationObserver 持续改写);
3. 远程环境:`e4817ab` 补齐 folderPath/workspaceFolders 到 localResourceRoots。

**可选补强(建议与 issue 587 联动实施,本次不做):**

- `file:///` 与 Windows 盘符绝对路径(`c:/x.png`)形式的 src 目前在 webview 内无解析支持
  (file: 子资源被浏览器拦截、盘符路径被当相对路径拼进 base)。
  可在 [imagePath.js](../../../resource/markdown/imagePath.js) 的统一重写入口增加这两类识别,
  按 md 所在目录(宿主已有 `folderPath` 的 webview URI,即现 `<base>` 值)重写为可加载 URL;
  保存回写时在 [readMarkdownWithOriginalImagePaths / restoreWorkspaceBaseUrls](../../../resource/markdown/imagePath.js#L46-L61)
  的既有 dataset 还原机制中同步处理,避免把改写后的 URL 写回 md。

## 验证方式

对应上方「复现步骤」逐条(当前版本 4.2.2,F5 调试扩展宿主):

1. 步骤 1-2 打开复现文件:预期**本地相对路径图片(`../image/sample.png`)与外链(Wikimedia SVG)
   均正常渲染**——若正常,说明 v3.5.4 的主因类(见根因第 3 节)在现行版本已由 `e0c132b` 消除;
2. 步骤 3 内置预览对照:预期两者表现一致(均显示),不再出现「扩展占位、内置正常」的分歧;
3. 追加对照(确认缺口边界,记录现象即可):
   - 在复现文件临时加一行 `![ws](/image/sample.png)`(工作区绝对路径,文件置于 test-workspace 根的
     `image/` 下):预期**当前版本可渲染**(e0c132b 重写生效);
   - 再加 `![file](file:///e:/.../sample.png)` 形式:预期**仍不渲染**(已知空洞,与 587 联动处理);
4. 回归项:
   - 编辑该文件并保存,确认 md 中原始引用字符串未被改写(restoreWorkspaceBaseUrls 不误伤相对路径);
   - 含空格/中文文件名的本地图片各测一张,确认 base 解析与编码正常;
   - 远程窗口(如 VS Code Remote)打开同文件,确认相对路径图片仍显示(localResourceRoots 生效)。
