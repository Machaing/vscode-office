# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/503

## 标题

[BUG]WLS2 windows linux 子系统 转换md 到pdf 出现错误

## 标签

bug(报告者 hongshui3000,创建于 2026-06-29,当前 open)

## 问题描述-原文

- OS:WLS2 windows linux 子系统
- Extension Version: 
4.0.9
vscode 连接wls 打开MD 文档，并且转换pdf 或者docx ，出现错误
Error: Not chromium found, export fail.


## 问题评论信息

无评论。

## 问题描述-中文

- 操作系统: WSL2(Windows 的 Linux 子系统;标题与正文中的 "WLS/wls" 为 WSL 笔误);
- 扩展版本: 4.0.9;
- 「VSCode 连接 WSL 打开 MD 文档,并且转换为 pdf 或 docx 时,出现错误:
  Error: Not chromium found, export fail.(未找到 chromium,导出失败。)」
- 正文无截图、无附件,未提供更多复现细节。

## 问题评论信息-中文

无。

## 补充归纳(非原文)

以下为本仓库分析归纳,非 issue 原文:

- 正文较简略,未提供更多复现细节。从报错看,导出功能依赖的浏览器(chromium)在 WSL 环境内未被发现:Windows 侧安装的 Chrome/Edge 在 WSL 的 Linux 文件系统中不存在于扩展内置的探测路径,WSL 内也未必安装了 Linux 版 chromium。

## 期望行为

(推断)在 WSL2 环境下导出 PDF/DOCX 应能成功:或自动探测到可用浏览器(含 Windows 侧浏览器在 WSL 下的挂载路径,如 `/mnt/c/...`),或在用户通过 `vscode-office.chromiumPath` 显式指定浏览器路径后可用;探测失败时应给出可操作的指引而非仅一句报错。

## 实际行为

导出失败,弹出 "Not chromium found, export fail.",PDF/DOCX 未生成。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-503-wsl-export-chromium.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 Markdown 导出载体,含标题、段落、列表、表格与代码块等常见渲染元素,用于验证导出 PDF 的完整链路。

### 复现步骤

1. 前置环境:Windows + WSL2 发行版;WSL 内**未**安装 chrome/chromium;VS Code 通过 Remote-WSL 打开本项目(扩展运行于 Linux 侧);`vscode-office.chromiumPath` 未设置;
2. F5 调起扩展调试,在开发扩展宿主中打开复现文件;
3. 使用 Markdown 编辑器工具栏的导出功能导出 PDF;
4. 预期: 导出成功生成 PDF;实际: 弹出 "Not chromium found, export fail.",无 PDF 生成,与 issue 现象一致;
5. 对照实验:设置 `vscode-office.chromiumPath` 指向可用浏览器路径(WSL 内安装的 chromium,或 Windows 侧浏览器在 WSL 下的路径,如 `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`)后再次导出,验证是否成功 —— 以界定问题是否仅出在"浏览器自动探测不适配 WSL 场景"。

## 根因定位

已定位。报错文案唯一出处是 [markdownService.ts:117-119](../../../src/service/markdownService.ts#L117-L119) `getChromiumPath` 的兜底分支(i18n key `ext.markdown.noChromium` → `package.nls.json:15` "Not chromium found, export fail.")。

浏览器解析链(`getChromiumPath`,[markdownService.ts:103-121](../../../src/service/markdownService.ts#L103-L121)):

1. 用户配置 `vscode-office.chromiumPath`(package.json:728-731,默认未设置)prepend 候选表并逐个 `existsSync`([markdownService.ts:104-111](../../../src/service/markdownService.ts#L104-L111));
2. 硬编码候选表 `this.paths`([markdownService.ts:84-101](../../../src/service/markdownService.ts#L84-L101));
3. 兜底 `chromeFinder()`(chrome-finder@1.0.7,[markdownService.ts:112-115](../../../src/service/markdownService.ts#L112-L115)),失败抛 'no chrome installations found' 后被 catch 转为用户看到的报错。

且任何非 html 导出都会**无条件**先执行该探测:`exportMarkdown` → `convertMd({ config: this.getConfig(option) })`([markdownService.ts:37](../../../src/service/markdownService.ts#L37)),`getConfig` 内 `"executablePath": this.getChromiumPath()`([markdownService.ts:52](../../../src/service/markdownService.ts#L52))——因此 PDF 必然、DOCX(无论是否含公式/mermaid,含时还会二次启动 puppeteer,html-export.js:112-131)都会先因找不到浏览器而中断。

WSL(Remote-WSL,扩展宿主在 Linux 侧,`process.platform === 'linux'`)下三级候选全部落空:

- Windows 段候选(`C:\Program Files (x86)\...`、`join(homedir(), "AppData\\Local\\...")` → `/home/xx/AppData\Local\...`,markdownService.ts:86-89)在 Linux 文件系统上不存在;
- Linux 段候选 `/usr/bin/google-chrome`、`/usr/bin/chromium`、`/snap/bin/chromium` 等(markdownService.ts:95-100)要求 WSL 内已安装 Linux 浏览器,issue 用户未安装;
- chrome-finder 的 linux 实现(node_modules/chrome-finder/lib/linux.js:36-104)只扫 `~/.local/share/applications/`、`/usr/share/applications/` 下的 .desktop Exec 记录、`/usr/bin` 等 6 个固定目录、`which` 命令——全部是 Linux 原生位置,**不含 `/mnt/c/` 下的 Windows 浏览器挂载**;全空时 `findChrome` 抛 'no chrome installations found'(lib/index.js:28-32)。

**结论:浏览器探测完全面向"当前 OS 原生安装位置",没有 WSL 场景下 Windows 浏览器(`/mnt/c` 挂载)的候选;探测失败时也只有一句报错、无可操作指引。**

### `chromiumPath` 指向 /mnt/c 的 Windows 浏览器是否可行(复现步骤 5 对照实验的界定)

配置路径会 prepend 候选表且 `existsSync` 对 `/mnt/c`(drvfs 挂载)有效,即浏览器可被"选中"并作为 puppeteer-core(25.10.0)的 `executablePath` 传入;WSL interop 也允许 Linux 侧直接 exec Windows .exe(推断,WSL 默认启用)。但能否真正出 PDF 受 puppeteer 启动机制三重制约(puppeteer-core 源码证据):

| # | 制约 | 证据 |
|---|---|---|
| a | **DevTools 连接地址**:launchOptions 未设 pipe([html-export.js:48-52](../../../src/service/markdown/html-export.js#L48-L52))→ 默认 `--remote-debugging-port=0`(puppeteer-core ChromeLauncher.js:58-68),puppeteer 从浏览器 stderr 解析 `ws://127.0.0.1:PORT/...` 并从 WSL 侧连接该地址。Windows 浏览器监听的是 **Windows 侧** 127.0.0.1:WSL2 默认 NAT 网络下两个 loopback 不互通 → 连接超时/启动失败;仅 WSL1(与 Windows 共享网络栈)或 Win11 22H2+ mirrored networking(`.wslconfig` `networkingMode=mirrored`)下可达 | ChromeLauncher.js:58-68 |
| b | **临时 user-data-dir 是 Linux 路径**:`/tmp/puppeteer_dev_chrome_profile-xxx`(BrowserLauncher.js:324-327 `tmpdir()`+mkdtemp;ChromeLauncher.js:69-81)原样传给 Windows 进程,Windows 端将 `/tmp` 解析到当前盘根,行为未定义 | BrowserLauncher.js:324-327 |
| c | **页面资源不可寻址**:导出走 file:// 临时 HTML(Linux 下写在 md 同目录,html-export.js:40-47),图片绝对化与 mermaid 本地脚本 URL 均为 Linux `file:///` 路径(markdown-pdf.js:46、html-export.js:47、markdown-pdf.js:204-231),Windows 浏览器读不到;`page.goto` 失败后回退 `page.setContent`(html-export.js:63-66)可出正文,但本地图片/mermaid 缺失 | html-export.js:47、63-66 |

**界定结论:指向 /mnt/c 的 Windows 浏览器不是可靠 workaround**(WSL2 默认 NAT 下大概率卡在启动连接;WSL1/mirrored 下勉强可用但有 b/c 资源缺陷);可靠路径是**在 WSL 内安装 chromium/google-chrome**(命中内置探测表,或显式配 `chromiumPath: /usr/bin/chromium`)。[docs/faq/markdown-export.md:12-18](../../../docs/faq/markdown-export.md) 现有"设置 chromiumPath"的说明在 WSL 场景需要补充此界定。

排除项:

- 非导出功能自身 bug:同一环境安装 Linux chromium 后即可走通(候选表 markdownService.ts:95-100 命中,链路无其它平台特判);
- 非 root 沙箱问题:`getPuppeteerArgs`([markdownService.ts:64-82](../../../src/service/markdownService.ts#L64-L82))仅对 uid=0 追加 `--no-sandbox`,WSL 默认用户非 root,且该问题的报错形态是启动崩溃而非 "Not chromium found";
- 非 puppeteer-core 缺失问题:依赖已随构建单独 bundle(build.ts dependencies)。

## 修复方案

分层:探测增强 + 失败指引 + 文档,不改第三方依赖。

1. **WSL 挂载候选增强**([markdownService.ts:84-101](../../../src/service/markdownService.ts#L84-L101)):`process.platform === 'linux'` 且检测到 WSL(读 `/proc/sys/kernel/osrelease` 或 `/proc/version` 含 `microsoft`,或 `existsSync('/mnt/c')`)时,在 Linux 原生候选之后追加 Windows 浏览器挂载路径候选,例如:
   - `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
   - `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe`
   - `/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe`
   注意:该项仅在 WSL1/mirrored 网络下真正可用(NAT 下受上表 a 项制约连接失败),**不能单独作为完整修复**,必须与第 2 条配合;若要 NAT 下也可用需将 DevTools 端点重写为 Windows 宿主 IP(puppeteer `browserURL` 参数化),成本与不确定性高,本期不做、记录为后续可选。
2. **失败分支给出可操作指引**([markdownService.ts:117-119](../../../src/service/markdownService.ts#L117-L119) + i18n):检测到 WSL 时报错文案改为指引式,如「未找到可用浏览器:请在 WSL 内安装 chromium(如 `sudo apt install chromium`),或将 `vscode-office.chromiumPath` 指向 WSL 内浏览器路径;WSL2 默认网络模式下无法直接使用 /mnt/c 的 Windows 浏览器」。新增 i18n key(或参数化 `ext.markdown.noChromium`),同步 `package.nls.json:15` 及其余 10 份语言文件;非 WSL 平台保留原文案。
3. **错误分级(可选增强)**:区分「未找到浏览器」与「启动/渲染失败」——`puppeteer.launch` 的 catch 目前只 console(html-export.js:55-58),建议同样 `showErrorMessage`,使步骤 5 对照实验中 NAT 模式的启动失败可见(而非只静默落在 Output)。`exportMarkdown` 外层已有 catch + `Output.log`(markdownService.ts:39-41),保持单一弹窗、避免双弹。
4. **文档**([docs/faq/markdown-export.md](../../../docs/faq/markdown-export.md) 与 `-CN`):补 WSL 小节,写明推荐做法(WSL 内装 chromium / `chromiumPath` 指向 WSL 内路径)与 /mnt/c Windows 浏览器的网络模式限制。

不做:修改 chrome-finder(第三方依赖);引入浏览器自动下载(`@puppeteer/browsers` install,体积与网络成本高)。

## 验证方式

对应复现步骤逐条(主验需 WSL2 环境;无 WSL 时以第 5 条代验证):

1. **步骤 4**(未设 chromiumPath、WSL 无 chromium):改动前弹 "Not chromium found, export fail.";改动后弹含指引的新文案(明确给出两条出路),Output 面板仍记录原始错误信息;
2. **步骤 4 加强(回归)**:WSL 内 `sudo apt install chromium` 后(不改任何配置)再次导出 → 成功生成 PDF,内容(标题/段落/列表/表格/代码块)完整——验证探测链对 Linux 原生安装仍然有效;
3. **步骤 5 对照实验**:
   - a. `chromiumPath` 指向 `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` + WSL2 默认 NAT:预期启动阶段失败(配合修复 3 报错含连接/超时信息),PDF 不生成 → 证实界定结论;
   - b. 同路径 + `.wslconfig` `networkingMode=mirrored`(Win11 22H2+):预期可导出,正文/表格/代码块正常,本地图片与 mermaid 可能缺失(b/c 项资源寻址限制)→ 记录为已知边界;
   - c. `chromiumPath` 指向 `/usr/bin/chromium`(WSL 内):预期成功(等价第 2 条);
4. **回归(非 WSL)**:Windows 本机导出 PDF/DOCX/HTML 不受影响(候选表仅新增 Linux+WSL 分支,原有顺序不变);root Linux 容器下 `puppeteerArgs` 行为不变;DOCX 含 katex/mermaid 的二次渲染链路不变;
5. **代验证(无 WSL 环境)**:对 WSL 检测函数做纯逻辑代入(mock `/proc/version` 内容)确认候选表构造正确;Windows 本机确认 `process.platform === 'win32'` 完全不进入新增逻辑;macOS 同理。
