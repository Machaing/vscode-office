# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/415

## 标题

[BUG] Error When Saving to S3 Using AWS Toolkit for VSCode

## 标签

bug(报告者 markositu,创建于 2025-07-02,当前 open)

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

- 操作系统: all(全平台);扩展版本: 3.5.4;
- **问题描述**: 使用 AWS Toolkit for VSCode 时,用户在尝试打开并编辑存储于 Amazon S3 的 `.xlsx` 文件时会遇到问题,以下步骤概述了导致错误的经过:
  1. 打开 AWS Toolkit for VSCode;
  2. 导航到 S3 存储桶并找到目标 `.xlsx` 文件;
  3. 尝试打开该 `.xlsx` 文件进行编辑;
  4. 修改内容后尝试保存文件。
- **遇到的错误**: 尝试保存文件时弹出一个对话框,错误消息为
  "Unable to open S3 file, try reopening from the explorer."(无法打开 S3 文件,请尝试从资源管理器重新打开。)
- 正文无截图、无附件。

## 问题评论信息-中文

无。

## 补充归纳(非原文)

以下为本仓库分析归纳,非 issue 原文:

- 该错误文案来自 AWS Toolkit 自身,说明 S3 文件的打开/保存链路在本扩展接管 `*.xlsx` 自定义编辑器后被破坏。

## 期望行为

(推断)通过 AWS Toolkit 打开的 S3 `.xlsx` 能在扩展的 Excel 编辑器中编辑并正常保存回 S3;若扩展无法支持该远程 scheme,则不应接管、交还 AWS Toolkit 原生编辑流程,至少不弹出错误。

## 实际行为

编辑 S3 上的 `.xlsx` 后保存,弹出 "Unable to open S3 file, try reopening from the explorer.",保存失败。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/excel/test-excel-cweijan-415-s3-save-error.xlsx`
生成脚本: `test-workspace/_generate/issue_415_s3_save_error.py`

文件内容说明: 最小 xlsx(一张工作表、少量单元格数据),作为上传到 S3 后经 AWS Toolkit 打开编辑的载体。该 issue 的保存链路依赖 AWS Toolkit 的 S3 远程文件(非 `file://` scheme),无法在纯本地文件上复现,本地文件仅作 S3 上传载体;核心操作步骤见下方手动复现步骤。

### 复现步骤

1. 准备:安装 AWS Toolkit for VSCode(开发扩展宿主中同样需要安装),配置好 AWS 凭证与一个可写的 S3 桶;
2. 将复现文件 `test-excel-cweijan-415-s3-save-error.xlsx` 上传到该 S3 桶;
3. F5 调起扩展调试,在开发扩展宿主中从 AWS Toolkit 的 S3 资源面板打开该 `.xlsx`(应被本扩展的 Excel 编辑器接管);
4. 修改任意单元格内容后 Ctrl+S 保存;
5. 预期: 内容保存回 S3(或至少不弹错);实际: 弹出 "Unable to open S3 file, try reopening from the explorer.",与 issue 现象一致。

## 根因定位

已定位接管机制与弹窗链路;provider 失联的具体触发时机为推断(见文末,不影响修复方向)。

### 接管机制(确认)

1. **selector 无 scheme 限定**:[maizhuoying.officeViewer](../../../package.json#L365) 对 Excel 家族使用裸模式 `*.xlsx`(package.json:374;同 371/377/389/392 的 `*.xls`/`*.xlsm`/`*.tsv`/`*.ods`)。VS Code 对 customEditors `filenamePattern` 的匹配规则(vscode 源码 `editorResolverService` 的 `globMatchesResource`):**模式不含 `/` 时只匹配 basename**,任意 scheme 都命中;模式含 `/` 时匹配 `scheme:path`——这正是本仓库 csv/docx/md 用 `file:/**/*.csv`、`vscode-remote:/**`、`vscode-vfs:/**` 三件套限定 scheme 的原因(package.json:380-401)。因此 `s3:/区域/桶/key.xlsx` 的 basename `key.xlsx` 命中 `*.xlsx`。
2. **优先级**:officeViewer 未声明 `priority`(package.json:365-372)→ 默认 `"default"`,成为该资源默认编辑器(对比 imageViewer 显式声明 `"option"`)。
3. **AWS Toolkit 侧入口**(aws/aws-toolkit-vscode,master 与 v1.90/v2.0 各版本一致):S3 文件"编辑"URI scheme 为 `s3`(只读为 `s3-readonly`,`packages/core/src/awsService/s3/fileViewerManager.ts:21-22`);对非 UTF-8 内容(xlsx 即是)其 `openEditor` **主动 defer 给 `vscode.open`**(fileViewerManager.ts:168-175)→ 编辑器解析命中本扩展 → 本扩展 Excel webview 接管打开(read 链路:[officeViewerProvider.ts:29-46](../../../src/provider/officeViewerProvider.ts#L29-L46),suffix 分发 `.xlsx` → excel,55-62)。

### 保存链路与弹窗来源(确认)

4. 本扩展对非 file scheme 的保存完全由 webview 消息驱动:OfficeViewerProvider 是 `CustomReadonlyEditorProvider`([officeViewerProvider.ts:16](../../../src/provider/officeViewerProvider.ts#L16)、29-31),**不参与** VS Code `saveCustomDocument`/backup 链路。链路:Excel.tsx:366 `spreadSheet.on('save')` → excel_writer.ts:203 `emit('save', bytes)` → [commonHandler.ts:59-70](../../../src/provider/compress/commonHandler.ts#L59-L70) `workspace.fs.writeFile(uri, res)`(virtual uri 读取同理走 `workspace.fs.readFile`,officeContent.ts:133-149、159-188)。
5. `s3` scheme 由 AWS Toolkit 的 `VirtualFileSystem` 提供服务(注册于其 `packages/core/src/awsService/s3/activation.ts:44`;构造时注入 genericError 文案 **"Unable to open S3 file, try reopening from the explorer"**,activation.ts:37-39)。该 FS 对**未注册 S3FileProvider 的 URI** 的任何操作(stat/read/write)都抛这个 Error(`virtualFilesystem.ts:58-64`)——这是该文案的唯一产生点。
6. **弹窗展示者是本扩展的 Handler**:[handler.ts:18-25](../../../src/common/handler.ts#L18-L25) 的 catch 对回调异常执行 `showErrorMessage(error.message)` → 用户看到的正是 toolkit 的 genericError 原文。

**根因一句话:selector 未限定 scheme 导致扩展接管了 AWS Toolkit 的 `s3://` xlsx,保存时对第三方 virtual scheme 盲目 `workspace.fs` 写入,provider 不在场时写入被拒,Handler 又把第三方 provider 的内部错误文案原样弹窗。**

### provider 失联的触发时机(推断)

toolkit 的 S3FileProvider 注册/注销绑定其自身 S3Tab 生命周期(`createTab` 中先注册再 open;仅当拿到 text editor 引用时 tab dispose 才注销,fileViewerManager.ts:279-306,注释明确"webview 型编辑器接管时 provider 保留")。理论上接管后写入应可达 `S3FileProvider.write` 并上传 S3,故用户遇到的失败对应 provider 已不在的窗口,候选:

- toolkit 扩展重载/凭证或区域切换触发 `manager.dispose()` 清空 providers,而本扩展的编辑器 tab 仍在(窗口重开恢复 tab 后 init 的 readFile 也会踩同一异常);
- 用户经只读入口打开(`s3-readonly` scheme,注册参数 `{ isReadonly: true }`)后编辑保存;
- 用户所用 toolkit 版本的清理策略更激进(`onDidCloseTextDocument` 兜底清理)。

无 S3 环境且依赖用户当时 toolkit 版本,未能确认具体是哪种。

排除项:

- 非 Node fs 直写 s3 uri:3.5.4 时代与当前代码均走 `workspace.fs.writeFile`(git show 24f3e35 核对,上游同期实现一致);
- 非 `isUriReadOnly` 误判拦截:非 file/git scheme 直接返回 false 不拦截(commonHandler.ts:61-64、fileReadOnly.ts:8-10),写入确实发出;
- 非 VS Code 保存链(backup/`onDidSave`)问题:readonly provider 无此链路,保存不走 workbench。

## 修复方案

1. **主修复:Excel 家族 selector 增加 scheme 白名单**(package.json:371-392)。把 `*.xls`/`*.xlsx`/`*.xlsm`/`*.tsv`/`*.ods` 五个裸模式改为与 csv/docx 相同的三件套,每种格式展开为:
   - `file:/**/*.xlsx`、`vscode-remote:/**/*.xlsx`、`vscode-vfs:/**/*.xlsx`(其余四种同理)
   生效原理:含 `/` 的模式按 `scheme:path` 匹配,`s3:`、`s3-readonly:` 及其它第三方 virtual scheme 不再命中 → AWS Toolkit 的 `vscode.open` 落回默认编辑器(回到未安装本扩展时的基线行为),保存链不再被本扩展劫持,弹窗消失。
   - 说明:排除后 toolkit 对非文本 s3 文件的展示回归 VS Code 原生行为(可能提示二进制无法以文本展示),属 toolkit 与原生 VS Code 的既有交互,非本扩展职责;用户仍可通过"打开方式"显式选择本扩展浏览(只读语义)。
   - 范围:本次只动 Excel 家族(可编辑可保存,正是本 issue 场景);officeViewer 其余裸模式(pdf/epub/字体/psd/xmind/tiff/heif 等)与 archiveViewer 同样会接管第三方 scheme,但为纯查看、保存需求弱,记录为后续统一治理项,不本次扩大改动面。
2. **辅助:save 链路对第三方 scheme 的失败兜底**([commonHandler.ts:59-70](../../../src/provider/compress/commonHandler.ts#L59-L70)):`workspace.fs.writeFile` 包 try/catch,失败时弹本扩展自身文案(如「目标位于远程文件系统({scheme}),写入被其提供方拒绝;可使用工具栏另存为本地文件」)并保留 saveAs 出路,替代目前把 provider 原始 message 直接弹给用户;该改动同时利好其它 virtual scheme 下的失败体验。注意失败时不应执行 `setDirty(false)`/`saveDone`,保持 dirty 星号让用户可重试或另存。
3. (可选)[officeViewerProvider.ts](../../../src/provider/officeViewerProvider.ts) 打开非白名单 scheme 时在 Output 打一条「该 scheme 未受完整支持,保存可能失败」提示,不改行为。

## 验证方式

有 AWS 环境时按复现步骤主验;无 S3 环境时以第 3 条 mock 代验证(本仓库当前无 S3 凭证,实际执行时走代验证 + 记录待外部验证):

1. **步骤 3 预期变化(主验)**:从 AWS Toolkit S3 面板打开 `.xlsx`,不再进入本扩展 Excel 编辑器,与卸载本扩展后的行为一致(回归 toolkit 原生流程/VS Code 默认编辑器);
2. **步骤 4 预期变化(主验)**:不再出现 "Unable to open S3 file, try reopening from the explorer." 弹窗(本扩展不再发起对该 uri 的读写);toolkit 侧 S3 编辑保存回归其自身行为;
3. **代验证(无 S3)**:开发扩展宿主中注册 mock FileSystemProvider(scheme 如 `s3mock`:`readFile` 返回复现文件 `test-excel-cweijan-415-s3-save-error.xlsx` 字节、`writeFile` 抛与 toolkit 相同文案的 Error),执行 `vscode.open` 打开 `s3mock:/bucket/test-excel-cweijan-415-s3-save-error.xlsx`:
   - 改动前:被本扩展 Excel 编辑器接管,保存(Ctrl+S/工具栏)弹 mock 错误文案——完整复现弹窗链路;
   - 改动后:不再被接管(验证 selector 排除生效);
4. **回归**:file scheme 下 xls/xlsx/xlsm/csv/tsv/ods 的打开-编辑-保存-另存为;vscode-remote(WSL/SSH)与 vscode-vfs(vscode.dev web 扩展,customEditors 由同一份 package.json 生效)打开正常;zip 等 archiveViewer 不受影响;「打开方式」手动选 Excel Viewer 仍可用;辅助修复生效后,virtual scheme 下保存失败弹本扩展文案且 dirty 星号保留。
