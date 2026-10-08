# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/503

## 标题

[BUG]WLS2 windows linux 子系统 转换md 到pdf 出现错误

## 标签

bug（报告者 hongshui3000，创建于 2026-06-29，当前 open）

## 问题描述-原文

- OS:WLS2 windows linux 子系统
- Extension Version: 
4.0.9
vscode 连接wls 打开MD 文档，并且转换pdf 或者docx ，出现错误
Error: Not chromium found, export fail.


## 问题评论信息

无评论。

## 问题描述-中文

- 操作系统：WSL2（Windows 的 Linux 子系统；标题与正文中的 "WLS/wls" 为 WSL 笔误）；
- 扩展版本：4.0.9；
- 「VSCode 连接 WSL 打开 MD 文档，并且转换为 pdf 或 docx 时，出现错误：
  Error: Not chromium found， export fail.（未找到 chromium，导出失败。）」
- 正文无截图、无附件，未提供更多复现细节。

## 问题评论信息-中文

无。

## 补充归纳（非原文）

以下为本仓库分析归纳，非 issue 原文：

- 正文较简略，未提供更多复现细节。从报错看，导出功能依赖的浏览器（chromium）在 WSL 环境内未被发现：Windows 侧安装的 Chrome/Edge 在 WSL 的 Linux 文件系统中不存在于扩展内置的探测路径，WSL 内也未必安装了 Linux 版 chromium。

## 期望行为

（推断）在 WSL2 环境下导出 PDF/DOCX 应能成功：或自动探测到可用浏览器（含 Windows 侧浏览器在 WSL 下的挂载路径，如 `/mnt/c/...`），或在用户通过 `vscode-office.chromiumPath` 显式指定浏览器路径后可用；探测失败时应给出可操作的指引而非仅一句报错。

## 实际行为

导出失败，弹出 "Not chromium found, export fail."，PDF/DOCX 未生成。

# 问题确认及解决

## 复现数据

复现文件：`test-workspace/markdown/test-markdown-cweijan-503-wsl-export-chromium.md`
生成脚本：文本文件，直接维护

文件内容说明：最小 Markdown 导出载体，含标题、段落、列表、表格与代码块等常见渲染元素，用于验证导出 PDF 的完整链路。

### 复现步骤

1. 前置环境：Windows + WSL2 发行版；WSL 内**未**安装 chrome/chromium;VS Code 通过 Remote-WSL 打开本项目（扩展运行于 Linux 侧）；`vscode-office.chromiumPath` 未设置；
2. F5 调起扩展调试，在开发扩展宿主中打开复现文件；
3. 使用 Markdown 编辑器工具栏的导出功能导出 PDF；
4. 预期：导出成功生成 PDF；实际：弹出 "Not chromium found, export fail."，无 PDF 生成，与 issue 现象一致；
5. 对照实验：设置 `vscode-office.chromiumPath` 指向可用浏览器路径（WSL 内安装的 chromium，或 Windows 侧浏览器在 WSL 下的路径，如 `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`）后再次导出，验证是否成功 —— 以界定问题是否仅出在"浏览器自动探测不适配 WSL 场景"。

## 根因定位

**结论先行：导出 PDF/DOCX 依赖扩展先找到一个本机浏览器、再启动它完成渲染；而浏览器探测只认「当前操作系统的原生安装位置」。WSL 是 Linux 环境，Windows 侧安装的浏览器不在探测范围，WSL 内又没装 Linux 浏览器，三级探测全部落空，用户只得到一句没有任何出路的报错。**

> **术语说明**（下文反复出现，先统一注释）：
> - **puppeteer（-core）**：Node.js 的无头浏览器控制库。本扩展导出 PDF/DOCX 由它启动本机的 Chrome/Edge 完成渲染，「找到浏览器」因此是导出的前置条件；
> - **chromiumPath**：本扩展的配置项（`vscode-office.chromiumPath`），让用户显式指定浏览器可执行文件的路径；
> - **chrome-finder**：第三方依赖包，职责是在各操作系统常见的安装位置搜索浏览器；
> - **WSL1 / WSL2 / NAT / mirrored**：WSL 是 Windows 的 Linux 子系统，分两代实现。WSL2 默认 NAT 网络模式——Linux 子系统有独立网络，与 Windows 各自的 127.0.0.1 互不相通；Win11 22H2+ 可在 `.wslconfig` 配置 `networkingMode=mirrored`（镜像模式，与 Windows 共享网络栈）；WSL1 本就共享网络栈。VS Code Remote-WSL 打开项目时扩展宿主运行在 Linux 侧，Windows 的 C 盘在 WSL 内挂载为 `/mnt/c`。

### 报错从哪里来（已确认）

报错文案的唯一出处是 [markdownService.ts:117-119](../../../src/service/markdownService.ts#L117-L119) `getChromiumPath` 的最后兜底分支（多语言文案 key `ext.markdown.noChromium`，定义于 package.nls.json:15）。

浏览器按以下顺序寻找（`getChromiumPath`，[markdownService.ts:103-121](../../../src/service/markdownService.ts#L103-L121)）：

1. 用户配置的 `vscode-office.chromiumPath`（package.json:728-731，默认未设置）——若设置，插到候选表最前面，随后逐个检查文件是否存在（[markdownService.ts:104-111](../../../src/service/markdownService.ts#L104-L111)）；
2. 硬编码的候选路径表（[markdownService.ts:84-101](../../../src/service/markdownService.ts#L84-L101)）；
3. 仍找不到时，最后调 chrome-finder 兜底搜索（[markdownService.ts:112-115](../../../src/service/markdownService.ts#L112-L115)）；它也搜不到就抛 'no chrome installations found'，被 catch 后转成用户看到的那句报错。

而且**任何非 HTML 的导出都会先无条件探测浏览器**：`exportMarkdown` → `convertMd({ config: this.getConfig(option) })`（[markdownService.ts:37](../../../src/service/markdownService.ts#L37)），`getConfig` 里写死 `"executablePath": this.getChromiumPath()`（[markdownService.ts:52](../../../src/service/markdownService.ts#L52)）——所以 PDF 必然、DOCX（无论是否含公式/mermaid；含时还会二次启动浏览器，[html-export.js:112-131](../../../src/service/markdown/html-export.js#L112-L131)）都会先中断在「找不到浏览器」这一步。

### WSL 下三级探测为什么全部落空（已确认）

WSL 环境（Remote-WSL，扩展宿主在 Linux 侧，`process.platform === 'linux'`）下，三级候选一个都命中不了：

- **Windows 段候选**：`C:\Program Files (x86)\...` 这类 Windows 路径，以及用系统用户目录拼出来的 `AppData\Local\...` 路径——在 Linux 侧会拼成 `/home/xx/AppData\Local\...` 这种不存在的位置（markdownService.ts:86-89），Linux 文件系统上都不存在；
- **Linux 段候选**：`/usr/bin/google-chrome`、`/usr/bin/chromium`、`/snap/bin/chromium` 等（markdownService.ts:95-100）——前提是 WSL 内已经装了 Linux 版浏览器，issue 报告者没装；
- **chrome-finder 兜底**：它的 Linux 实现只扫描 Linux 原生位置——桌面快捷方式目录（`~/.local/share/applications/`、`/usr/share/applications/` 下的 .desktop 文件）、`/usr/bin` 等 6 个固定目录、`which` 命令（node_modules/chrome-finder/lib/linux.js:36-104），**不包含 `/mnt/c` 下的 Windows 浏览器**；全部落空时抛 'no chrome installations found'（lib/index.js:28-32）。

**结论：浏览器探测完全面向「当前操作系统的原生安装位置」，没有 WSL 场景下 Windows 浏览器（`/mnt/c` 挂载）的候选；探测失败时也只有一句报错，没有可操作的指引。**

### 把 chromiumPath 指向 /mnt/c 的 Windows 浏览器，可行吗（复现步骤 5 对照实验的界定）

配置的路径会插到候选表最前面，且「文件是否存在」检查对 `/mnt/c`（WSL 的 Windows 盘挂载）有效——浏览器能被选中，并作为 puppeteer-core（25.10.0）的 `executablePath` 传入；WSL 默认也允许 Linux 侧直接执行 Windows 的 .exe（推断）。但能否真正导出 PDF，还受 puppeteer 启动机制的三个条件制约（puppeteer-core 源码证据）：

| # | 制约 | 说明 | 证据 |
|---|---|---|---|
| a | **调试连接不互通** | 启动参数未用 pipe 模式（[html-export.js:48-52](../../../src/service/markdown/html-export.js#L48-L52)）→ 浏览器默认开一个随机调试端口，puppeteer 要从 WSL 侧连接 **Windows 侧**的 127.0.0.1;WSL2 默认 NAT 网络下两个 127.0.0.1 分属两个网络栈，互相不通 → 连接超时/启动失败。仅 WSL1（共享网络栈）或 Win11 22H2+ 的 mirrored 镜像模式下可达 | ChromeLauncher.js:58-68 |
| b | **临时用户数据目录是 Linux 路径** | `/tmp/puppeteer_dev_chrome_profile-xxx` 原样传给 Windows 进程，Windows 端会把 `/tmp` 解析到当前盘符根目录，行为不可预期 | BrowserLauncher.js:324-327 |
| c | **页面资源读不到** | 导出走 file:// 临时 HTML（Linux 下写在 md 同目录，html-export.js:40-47），图片绝对化与 mermaid 本地脚本 URL 都是 Linux 的 `file:///` 路径（markdown-pdf.js:46、204-231），Windows 浏览器读不到；页面加载失败后回退为直接注入 HTML（html-export.js:63-66）能出正文，但本地图片/mermaid 会缺失 | html-export.js:47、63-66 |

**界定结论：指向 /mnt/c 的 Windows 浏览器不是可靠的绕行办法**（WSL2 默认 NAT 下大概率卡在启动连接；WSL1/mirrored 下勉强可用，但有 b、c 两项资源缺陷）；**可靠做法是在 WSL 内安装 chromium/google-chrome**（命中内置探测表，或显式配 `chromiumPath: /usr/bin/chromium`）。[docs/faq/markdown-export.md:12-18](../../../docs/faq/markdown-export.md) 现有「设置 chromiumPath」的说明，在 WSL 场景需要补充这层界定。

已排除的方向：

- **不是导出功能自身的 bug**：同一环境装上 Linux chromium 后即可走通（命中探测表 markdownService.ts:95-100，链路没有其他平台特判）；
- **不是 root 沙箱问题**：`getPuppeteerArgs`（[markdownService.ts:64-82](../../../src/service/markdownService.ts#L64-L82)）仅对 uid=0（root 用户）追加 `--no-sandbox`，WSL 默认用户非 root；且该问题的报错形态是启动崩溃，而非 "Not chromium found"；
- **不是 puppeteer-core 缺失问题**：该依赖已随构建单独打包（见 build.ts 的 dependencies 清单）。

## 修复方案

分四层：探测增强 + 失败指引 + 错误分级 + 文档；不修改第三方依赖。

1. **探测增强：补充 WSL 下 Windows 浏览器的挂载路径候选**（[markdownService.ts:84-101](../../../src/service/markdownService.ts#L84-L101)）。当运行环境是 Linux 且检测到 WSL（读 `/proc/sys/kernel/osrelease` 或 `/proc/version` 内容含 `microsoft`，或 `/mnt/c` 存在）时，在 Linux 原生候选之后追加 Windows 浏览器的挂载路径，例如：
   - `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
   - `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe`
   - `/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe`

   注意：这些路径只在 WSL1/mirrored 网络下真正可用（NAT 下受上表 a 项制约，连接失败），**不能单独作为完整修复，必须与第 2 条配合**；若想让 NAT 下也可用，需要把调试端点改写为 Windows 宿主机的 IP（puppeteer 的 `browserURL` 参数化），成本与不确定性都高，本期不做，记为后续可选。
2. **失败时给出可操作的指引，而不是一句死话**（[markdownService.ts:117-119](../../../src/service/markdownService.ts#L117-L119) + 多语言文案）。检测到 WSL 时，报错文案改为指引式，如「未找到可用浏览器：请在 WSL 内安装 chromium（如 `sudo apt install chromium`），或将 `vscode-office.chromiumPath` 指向 WSL 内浏览器路径；WSL2 默认网络模式下无法直接使用 /mnt/c 的 Windows 浏览器」。新增多语言 key（或参数化 `ext.markdown.noChromium`），同步 `package.nls.json:15` 及其余 10 份语言文件；非 WSL 平台保留原文案。
3. **错误分级（可选增强）**：区分「未找到浏览器」与「找到了但启动/渲染失败」——目前 `puppeteer.launch` 失败只写 console（html-export.js:55-58），建议同样弹出提示，让对照实验中 NAT 模式下的启动失败可见（而不是只静默落在 Output 面板）；`exportMarkdown` 外层已有 catch + Output 日志（markdownService.ts:39-41），保持只弹一个窗，避免双弹。
4. **文档**（[docs/faq/markdown-export.md](../../../docs/faq/markdown-export.md) 与其中文版）：补 WSL 小节，写明推荐做法（WSL 内装 chromium / `chromiumPath` 指向 WSL 内路径）与 /mnt/c Windows 浏览器的网络模式限制。

不做：修改 chrome-finder（第三方依赖）；引入浏览器自动下载（`@puppeteer/browsers` 的 install，体积与网络成本高）。

## 验证方式

对应复现步骤逐条（主验需要 WSL2 环境；无 WSL 时以第 5 条模拟代验证）：

1. **步骤 4**（未设 chromiumPath、WSL 无 chromium）：改动前弹 "Not chromium found, export fail."；改动后弹含指引的新文案（明确给出两条出路），Output 面板仍记录原始错误信息；
2. **步骤 4 加强（回归）**：WSL 内 `sudo apt install chromium` 后（不改任何配置）再次导出 → 成功生成 PDF，内容（标题/段落/列表/表格/代码块）完整——验证探测链对 Linux 原生安装仍然有效；
3. **步骤 5 对照实验**：
   - a. `chromiumPath` 指向 `/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` + WSL2 默认 NAT:预期启动阶段失败（配合修复 3，报错含连接/超时信息），PDF 不生成 → 证实界定结论；
   - b. 同路径 + `.wslconfig` 配 `networkingMode=mirrored`（Win11 22H2+）：预期可导出，正文/表格/代码块正常，本地图片与 mermaid 可能缺失（b、c 两项资源限制）→ 记录为已知边界；
   - c. `chromiumPath` 指向 `/usr/bin/chromium`（WSL 内）：预期成功（等价第 2 条）；
4. **回归（非 WSL）**：Windows 本机导出 PDF/DOCX/HTML 不受影响（候选表仅新增 Linux+WSL 分支，原有顺序不变）；root Linux 容器下 `puppeteerArgs` 行为不变；DOCX 含 katex/mermaid 的二次渲染链路不变；
5. **模拟代验证（无 WSL 环境）**：对 WSL 检测函数做纯逻辑代入（模拟 `/proc/version` 内容）确认候选表构造正确；Windows 本机确认 `process.platform === 'win32'` 完全不进入新增逻辑；macOS 同理。
