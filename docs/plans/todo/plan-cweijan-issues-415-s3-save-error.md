# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/415

## 标题

[BUG] Error When Saving to S3 Using AWS Toolkit for VSCode

## 标签

bug（报告者 markositu，创建于 2025-07-02，当前 open）

## 问题描述-原文

- OS: all
- Extension Version: 3.5.4

## Description of the Issue:
When using the AWS Toolkit for VSCode, users encounter an issue when attempting to open and edit an .xlsx file stored in Amazon S3. The following steps outline the process leading to the error:


1. Open the AWS Toolkit for VSCode.
2. Navigate to the S3 bucket and locate the desired .xlsx file.
3. Attempt to open the .xlsx file for editing.
4. After making changes, try to save the file.

## Error Encountered:
Upon attempting to save the file, a dialog window appears with the following error message:
"Unable to open S3 file, try reopening from the explorer."

## 问题评论信息

无评论。

## 问题描述-中文

- 操作系统：all（全平台）；扩展版本：3.5.4；
- **问题描述**：使用 AWS Toolkit for VSCode 时，用户在尝试打开并编辑存储于 Amazon S3 的 `.xlsx` 文件时会遇到问题，以下步骤概述了导致错误的经过：
  1. 打开 AWS Toolkit for VSCode；
  2. 导航到 S3 存储桶并找到目标 `.xlsx` 文件；
  3. 尝试打开该 `.xlsx` 文件进行编辑；
  4. 修改内容后尝试保存文件。
- **遇到的错误**：尝试保存文件时弹出一个对话框，错误消息为
  "Unable to open S3 file, try reopening from the explorer."（无法打开 S3 文件，请尝试从资源管理器重新打开。）
- 正文无截图、无附件。

## 问题评论信息-中文

无。

## 补充归纳（非原文）

以下为本仓库分析归纳，非 issue 原文：

- 该错误文案来自 AWS Toolkit 自身，说明 S3 文件的打开/保存链路在本扩展接管 `*.xlsx` 自定义编辑器后被破坏。

## 期望行为

（推断）通过 AWS Toolkit 打开的 S3 `.xlsx` 能在扩展的 Excel 编辑器中编辑并正常保存回 S3；若扩展无法支持该远程 scheme，则不应接管、交还 AWS Toolkit 原生编辑流程，至少不弹出错误。

## 实际行为

编辑 S3 上的 `.xlsx` 后保存，弹出 "Unable to open S3 file, try reopening from the explorer."，保存失败。

# 问题确认及解决

## 复现数据

复现文件：`test-workspace/excel/test-excel-cweijan-415-s3-save-error.xlsx`
生成脚本：`test-workspace/_generate-script/issue_415_s3_save_error.py`

文件内容说明：最小 xlsx（一张工作表、少量单元格数据），作为上传到 S3 后经 AWS Toolkit 打开编辑的载体。该 issue 的保存链路依赖 AWS Toolkit 的 S3 远程文件（URI 以 `s3:` 开头，而非本地磁盘的 `file:`），无法在纯本地文件上复现，本地文件仅作 S3 上传载体；核心操作步骤见下方手动复现步骤。

### 复现步骤

1. 准备：安装 AWS Toolkit for VSCode（开发扩展宿主中同样需要安装），配置好 AWS 凭证与一个可写的 S3 桶；
2. 将复现文件 `test-excel-cweijan-415-s3-save-error.xlsx` 上传到该 S3 桶；
3. F5 调起扩展调试，在开发扩展宿主中从 AWS Toolkit 的 S3 资源面板打开该 `.xlsx`（应被本扩展的 Excel 编辑器接管）；
4. 修改任意单元格内容后 Ctrl+S 保存；
5. 预期：内容保存回 S3（或至少不弹错）；实际：弹出 "Unable to open S3 file, try reopening from the explorer."，与 issue 现象一致。

## 根因定位

**结论先行：本扩展在 package.json 里声明「接管 Excel 文件」时没有限定文件的来源，连 AWS Toolkit 的 S3 虚拟文件也被一并接管；保存时扩展直接向 VS Code 文件系统发起写入，而彼时 AWS Toolkit 的文件提供器已不在线，写入被拒——用户看到的错误弹窗，正是 AWS Toolkit 的内部错误文案，由本扩展原样转弹。**

> **术语说明**（下文反复出现，先统一注释）：
> - **scheme（协议头）**：URI 开头的协议部分，标识文件来自哪里。本地磁盘文件是 `file:`，WSL/SSH 远程窗口是 `vscode-remote:`，vscode.dev 网页版是 `vscode-vfs:`，AWS Toolkit 的 S3 文件是 `s3:`（只读入口是 `s3-readonly:`）；
> - **selector（文件选择器）**：package.json 中 `customEditors`（自定义编辑器）声明里的 `filenamePattern` 匹配模式，决定扩展接管哪些文件；
> - **basename（文件名）**：路径中不含目录的部分，如 `s3:/区域/桶/key.xlsx` 的文件名是 `key.xlsx`；
> - **FileSystemProvider（文件提供器）**：VS Code 中为自定义 scheme 提供读取/写入能力的注册机制。`s3:` 这类非磁盘文件，所有读写都必须由它的注册方（这里是 AWS Toolkit）兜底执行，别人代劳不了。

### 1. 接管是怎么发生的（已确认）

**扩展侧：selector 没有限定来源。** Excel 家族在 [package.json:371-392](../../../package.json#L371-L392) 用的是裸文件名模式（`*.xlsx`、`*.xls`、`*.xlsm`、`*.tsv`、`*.ods`），不含任何 scheme 信息。按 VS Code 的匹配规则（见 vscode 源码 `editorResolverService` 的 `globMatchesResource`），**模式不含 `/` 时只按文件名匹配，文件来自哪里都会命中**；模式含 `/` 时才会按「scheme + 完整路径」整体匹配。本仓库把 csv/docx/md 的声明写成 `file:/**/*.csv`、`vscode-remote:/**`、`vscode-vfs:/**` 三条并列（[package.json:380-401](../../../package.json#L380-L401)），正是用含 `/` 的模式把来源限定在这三种之内。于是 `s3:/区域/桶/key.xlsx` 凭文件名 `key.xlsx` 命中了 `*.xlsx`。

优先级上，officeViewer 没有声明 `priority`（编辑器优先级选项，[package.json:365-372](../../../package.json#L365-L372)），默认取 `"default"`，也就成了这类文件的**默认编辑器**；对比 imageViewer 显式声明了 `"option"`，只作为候选、不自居默认。

**AWS Toolkit 侧：它主动把非文本文件交给 VS Code。** AWS Toolkit（aws/aws-toolkit-vscode,master 与 v1.90/v2.0 各版本行为一致）对 S3 文件的「编辑」入口使用 `s3` scheme（只读入口为 `s3-readonly`，其源码 `fileViewerManager.ts:21-22`）；对非 UTF-8 内容（xlsx 正是二进制）它的 `openEditor` 不自己展示，而是转交 `vscode.open` 让 VS Code 按默认规则解析（`fileViewerManager.ts:168-175`）→ 解析命中本扩展 → 由本扩展的 Excel 编辑器接管打开（读入链路：[officeViewerProvider.ts:29-46](../../../src/provider/officeViewerProvider.ts#L29-L46) 按文件后缀把 `.xlsx` 分发到 excel 路由）。

### 2. 保存时为什么弹出的恰好是 AWS Toolkit 的错误文案（已确认）

**本扩展的保存不走 VS Code 原生保存链。** OfficeViewerProvider 实现的是 `CustomReadonlyEditorProvider`（只读自定义编辑器接口，[officeViewerProvider.ts:16](../../../src/provider/officeViewerProvider.ts#L16)），因此没有 VS Code 的 `saveCustomDocument`/backup（备份）环节；保存完全由 webview 消息驱动：表格组件发出 save 事件（[Excel.tsx:366](../../../src/react/view/excel/Excel.tsx#L366)）→ 写出文件字节（[excel_writer.ts:203](../../../src/react/view/excel/excel_writer.ts#L203)）→ 宿主收到后用 `workspace.fs.writeFile` 写回原 uri（[commonHandler.ts:59-70](../../../src/provider/compress/commonHandler.ts#L59-L70)）。打开时的读取同理，走 `workspace.fs.readFile`（[officeContent.ts:133-188](../../../src/provider/handlers/officeContent.ts#L133-L188)）。

**`s3:` 的读写由 AWS Toolkit 承接，而且认「提供器」不认文件。** `s3` scheme 注册于 toolkit 的 `activation.ts:44`，注册时就注入了那句兜底文案 "Unable to open S3 file, try reopening from the explorer."（`activation.ts:37-39`）；它的虚拟文件系统对**没有对应文件提供器**的 uri 做任何操作（查询/读/写）都会抛出这句错误（`virtualFilesystem.ts:58-64`）——这是该文案在全链路中唯一的出现点。

**弹窗的展示者其实是本扩展自己。** 宿主侧 Handler 的统一异常处理会把回调抛出的错误原样弹出（[handler.ts:18-25](../../../src/common/handler.ts#L18-L25) 的 `showErrorMessage(error.message)`），于是 toolkit 的内部错误一字不差地呈现给了用户。

**根因一句话：selector 未限定来源 → 扩展接管了 `s3://` 上的 xlsx → 保存时对第三方 scheme 盲目走 `workspace.fs` 写入 → 提供器不在线，写入被拒 → Handler 把第三方错误文案原样弹窗。**

### 3. 文件提供器为什么会不在线（推断，不影响修复方向）

toolkit 的 S3 文件提供器与其自身 S3 标签页的生命周期绑定：打开标签页时注册，标签页关闭时注销；且只有拿到文本编辑器引用时才注销，其源码注释明确写了「webview 型编辑器接管时提供器保留」（`fileViewerManager.ts:279-306`）。照此逻辑，本扩展接管后写入本应能到达 `S3FileProvider.write` 并上传回 S3——用户实际遇到的失败，对应的是提供器已不在的时间窗，候选场景：

- toolkit 扩展重载、切换凭证或区域时触发 `manager.dispose()` 清空全部提供器，而本扩展打开的编辑器标签页还在（窗口重开恢复标签页时，打开阶段的 readFile 也会踩同一个异常）；
- 用户经只读入口打开（`s3-readonly` scheme，注册参数 `{ isReadonly: true }`）后编辑保存；
- 用户所用 toolkit 版本的清理策略更激进（以 `onDidCloseTextDocument` 兜底清理）。

本仓库无 S3 环境，且依赖报告者当时的 toolkit 版本，无法确认具体是哪一种。

### 已排除的方向

- **不是直接用 Node fs 写 s3 uri**：3.5.4 时代与当前代码都走 `workspace.fs.writeFile`（经 git 历史 `24f3e35` 核对，与上游同期实现一致）；
- **不是本扩展的只读拦截误判**：只读判断对非 file/git scheme 直接放行（[commonHandler.ts:61-64](../../../src/provider/compress/commonHandler.ts#L61-L64)、fileReadOnly.ts:8-10），写入确实发出去了；
- **不是 VS Code 原生保存链（backup/`onDidSave`）的问题**：只读 provider 根本没有这条链路，保存不经 workbench。

## 修复方案

1. **主修复：给 Excel 家族的 selector 限定文件来源**（[package.json:371-392](../../../package.json#L371-L392)）。把 `*.xls`/`*.xlsx`/`*.xlsm`/`*.tsv`/`*.ods` 五个裸模式，每个都改成与 csv/docx 相同的写法——按来源展开为三条（`file:/**/*.xlsx`、`vscode-remote:/**/*.xlsx`、`vscode-vfs:/**/*.xlsx`，其余四种格式同理，共 5×3 条）。

   生效原理：含 `/` 的模式按「scheme + 路径」整体匹配，`s3:`、`s3-readonly:` 及其他第三方来源不再命中 → AWS Toolkit 转交 `vscode.open` 的文件落回 VS Code 默认编辑器（即未安装本扩展时的基线行为），本扩展不再碰这类 uri，弹窗自然消失。

   两点说明：
   - 排除接管后，S3 上的非文本文件回归 VS Code 原生展示（可能提示「二进制文件无法以文本显示」），这属于 toolkit 与 VS Code 的既有交互，不是本扩展的职责范围；用户仍可通过「打开方式」手动选择本扩展只读浏览；
   - 本次只改 Excel 家族——它们可编辑可保存，正是本 issue 的场景。officeViewer 其余纯查看类的裸模式（pdf/epub/字体/psd/xmind/tiff/heif 等）与压缩包查看器同样会接管第三方 scheme，但查看为主、保存需求弱，记为后续统一治理项，不在本次扩大改动面。

2. **辅助：保存写入失败时，弹本扩展自己的指引而不是第三方的原始报错**（[commonHandler.ts:59-70](../../../src/provider/compress/commonHandler.ts#L59-L70)）。给 `workspace.fs.writeFile` 包上 try/catch:失败时不再把提供器的原始 message 直接弹给用户，而是弹本扩展的提示（如「目标位于远程文件系统（{scheme}），写入被其提供方拒绝；可使用工具栏另存为本地文件」），给用户留出另存为本地的出路。注意失败时不要清掉 dirty 标记（标题栏的未保存星号），让用户可以重试或另存。该改动同时改善其他虚拟文件系统下的失败体验。

3. **（可选）打开不支持的来源时留个提示**：[officeViewerProvider.ts](../../../src/provider/officeViewerProvider.ts) 打开非白名单 scheme 的文件时，在 Output 面板输出一条「该文件来源未受完整支持，保存可能失败」，只提示、不改行为。

## 验证方式

有 AWS 环境时按「复现步骤」直接主验；本仓库当前没有 S3 凭证，实际执行时走第 3 条的模拟代验证，并记录「待外部环境验证」：

1. **复现步骤 3 的预期变化（主验）**：从 AWS Toolkit 的 S3 面板打开 `.xlsx`，不再进入本扩展的 Excel 编辑器，行为与卸载本扩展后一致（回到 toolkit 原生流程/VS Code 默认编辑器）；
2. **复现步骤 4 的预期变化（主验）**：不再出现 "Unable to open S3 file, try reopening from the explorer." 弹窗（本扩展不再对该 uri 发起读写）；toolkit 侧的 S3 编辑保存回归其自身行为；
3. **模拟代验证（无 S3 环境）**：在开发扩展宿主中注册一个模拟的 FileSystemProvider（scheme 取 `s3mock`：`readFile` 返回复现文件字节、`writeFile` 抛出与 toolkit 相同文案的错误），然后 `vscode.open` 打开 `s3mock:/bucket/test-excel-cweijan-415-s3-save-error.xlsx`：
   - 改动前：文件被本扩展 Excel 编辑器接管，保存（Ctrl+S/工具栏）弹出模拟错误文案——完整复现 issue 的弹窗链路；
   - 改动后：不再被接管（验证来源限定生效）；
4. **回归**：本地 file 下 xls/xlsx/xlsm/csv/tsv/ods 的打开-编辑-保存-另存为；vscode-remote（WSL/SSH）与 vscode-vfs（vscode.dev 网页版，customEditors 用的是同一份 package.json）打开正常；zip 等压缩包查看器不受影响；「打开方式」手动选 Excel Viewer 仍可用；辅助修复生效后，虚拟来源下保存失败弹本扩展文案且 dirty 星号保留。
