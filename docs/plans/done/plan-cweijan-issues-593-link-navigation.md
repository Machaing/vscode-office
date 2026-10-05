# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/593](https://github.com/cweijan/vscode-office/issues/593)

## 标题

[BUG] 浏览pdf时链接跳转失效

## 标签

bug

## 问题描述

提交者 LiuYuan-1108,2026-08-28。

环境:

- OS: Windows 11
- Extension Version: 4.2.0

正文指出浏览 PDF 时存在两类链接问题:

1. 指向同一文件内部位置(另一目录/书签)的链接:能被正确识别并显示为链接,但单击后无法实际跳转;
2. 外部链接(网页链接):无法被正确识别。

原文关键句:「如果是跳转到该文件的另一个目录的链接,可以正确识别,但是单击后无法跳转」。正文未单独列出复现步骤,隐含步骤为:用扩展打开含内部链接和外部网页链接的 PDF,分别点击两类链接。无上传文件/截图;截至抓取时无评论,无维护者回复。

## 期望行为

内部链接单击后跳转到 PDF 内对应位置(另一页/目录项);外部网页链接能被识别并打开(按正文归纳,未逐字明写)。

## 实际行为

内部链接单击无效;外部链接无法被识别为链接。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/pdf/test-pdf-cweijan-593-link-navigation.pdf`
生成脚本: `test-workspace/_generate/issue_593_link_navigation.mjs`

文件内容说明: 用 pdf-lib 生成 3 页 A4 PDF:

- 第 1 页:两个内部 GoTo 链接注记(`/Dest` 指向第 2、3 页顶部)与一个外部 URI 链接注记(GitHub 仓库);
- 第 2、3 页:各含一个返回第 1 页的内部链接与一个外部 URI 链接;
- 文档级 `/Outlines` 书签 3 项分别指向三页,并设置 `/PageMode /UseOutlines`(对应「另一目录/书签」跳转场景)。

标准 PDF 阅读器(Adobe/Chrome/Edge 内置)中内部跳转与外链均正常,可用作对照。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 在第 1 页点击「Goto Page 2 / Goto Page 3」链接文字,再点击外部链接文字,侧边栏点击书签;
3. 预期: 内部链接跳转到对应页,外链识别并可打开,书签跳页;实际: 内部链接点击无跳转,外部链接不被识别。

## 根因定位

问题在 viewer 侧,且是 **viewer.js 与 pdf.js 两个 bundle 版本错配**导致:

- `resource/pdf/pdf.js` 是 3.1.81 的 display API,其 `AnnotationLayer`(`LinkAnnotationElement`)渲染链接注解时按 3.1.81 的 linkService 接口调用:
  - 内部 GoTo 链接:`_bindLink` 设置 `link.onclick = () => { this.linkService.goToDestination(dest); return false; }`(pdf.js:10721-10732);
  - 外部 URI 链接:`render` 中调用 `linkService.addLinkAttributes(link, data.url, data.newWindow)`(pdf.js:10677-10679);
- `resource/pdf/viewer.js` 却是旧版本(约 2.15 时代,内含 `navigateTo` 而非改名后的 `goToDestination`),其 `PDFLinkService` 类只有 `navigateTo/getDestinationHash/...`,**没有 `goToDestination` 也没有 `addLinkAttributes` 方法**。侧边栏书签正常是因为上游定制过的 `PDFOutlineViewer._bindLink`(viewer.js:7379)直接调用 `linkService.navigateTo(dest)`,绕开了缺失的接口。

由此产生 issue 的两类现象(均已在浏览器中实测复现):

1. **内部链接单击不跳转**:`goToDestination is not a function` 在 onclick 内抛出 TypeError,`return false` 未执行,跳转逻辑完全未运行(且默认的 hash 导航会指向死链 `/pdf/#%5B...%5D`)。链接本身已渲染(hover 高亮正常),故"能识别但不能跳转"。
2. **外部链接不被识别**:`addLinkAttributes is not a function` 在 `LinkAnnotationElement.render()` 渲染 URI 注解时抛出,而 `AnnotationLayer.render` 的循环(pdf.js:12200)没有按注解的 try/catch,异常直接中止整页注解渲染循环——外部链接的 `<a>` 从未插入 DOM(该页位于其后的注解也一并丢失),故"无法被识别"。

另有一个即使补齐接口也存在的问题:webview 中 VS Code 拦截顶层导航,`<a href="https://...">` 点击不会有任何反应,外链必须经 postMessage 通知宿主 `vscode.env.openExternal` 打开(宿主侧 `handleCommonEvent` 已有现成的 `openExternal` 消息处理,src/provider/compress/commonHandler.ts:103)。

## 修复方案

最小改动补齐缺失接口 + 桥接外链,不动 pdf.js、不升级版本:

1. `resource/pdf/viewer.js`(module 18 `PDFLinkService`):
   - 新增 `goToDestination(dest)` 委托给已有的 `navigateTo(dest)`(3.1.81 中两者逻辑一致);
   - 新增 `addLinkAttributes(link, url, newWindow)`,复用 module 4 兼容层注入的 `_pdfjsLib.addLinkAttributes`(与 `PDFOutlineViewer._bindLink` 相同用法),按 `externalLinkTarget/externalLinkRel/externalLinkEnabled` 设置 href/target/rel;
   - `SimpleLinkService` 同步补 `goToDestination(dest) {}` 空实现保持接口一致(仅 DefaultAnnotationLayerFactory 使用,非主链路)。
2. `resource/pdf/main.js`:新增 `setupExternalLinkBridge()`,document 级 click 委托捕获 annotationLayer/outline 中原始 href 以 `http(s)://` 开头的 `<a>`,`preventDefault` 后:
   - webview 环境(存在 `acquireVsCodeApi`)→ `vscodeEvent.emit('openExternal', href)` 走宿主 `vscode.env.openExternal`;
   - 普通浏览器(本地测试)→ 回退 `window.open(href, '_blank', 'noopener,noreferrer')`。
   - 内部链接 href 为 `#...`(getDestinationHash 生成)不匹配正则,仍由 pdf.js 自身 onclick 处理,互不干扰。

## 修复记录

- 日期: 2026-09-14
- 修改文件:
  - `resource/pdf/viewer.js`:module 18 增加 `_pdfjsLib` 引用;`PDFLinkService` 新增 `goToDestination`/`addLinkAttributes` 两方法;`SimpleLinkService` 补空 `goToDestination`。
  - `resource/pdf/main.js`:新增 `setupExternalLinkBridge()` 并在 load 时挂接。
- 未改动:pdf.js、viewer.html、宿主代码(`openExternal` 处理已存在,无需新通信)。

## 验证方式

静态服务(node, `{{baseUrl}}`→`/pdf`)加载修改后的 viewer.html,向页面 postMessage `{type:'open', content:{buffer}}` 模拟宿主下发文件,打开复现 PDF,用 chrome-devtools MCP 实测:

1. **修复后(全部通过,console 无任何报错)**:
   - 第 1 页 annotationLayer 渲染出 3 个链接:两个内部 `#%5B...%5D` + 外部 `https://github.com/cweijan/vscode-office`(修复前外链缺失);第 2/3 页滚动可见后同样渲染出内链+外链;
   - 点击第 1 页内部链接 → `PDFViewerApplication.page` 变为 2;点击第 2 页返回链接 → 回到 1;滚动到第 3 页点击返回链接 → 回到 1;
   - stub `window.open` 后点击外链 → 以 `https://github.com/cweijan/vscode-office` 调用且 `event.preventDefault()` 生效(dispatchEvent 返回 false),页面不导航;webview 下同一路径走 `vscodeEvent.emit('openExternal', url)`;
   - 回归:侧边栏 3 个书签点击跳页正常(3 号书签 → 第 3 页)、工具栏翻页(1→2)正常、缩放 125%→140% 正常、翻页/滚动/主题切换无异常。
2. **修复前复现(用 initScript 删除原型上两方法模拟旧代码)**:第 1 页只有 2 个内部链接、无外链(`addLinkAttributes` 抛错中止渲染循环);内部链接 `onclick()` 直接抛 `this.linkService.goToDestination is not a function`;真实 click 还会因 onclick 抛错导致 `return false` 未执行而导航到死链 hash——与 issue 两类现象一一对应。
