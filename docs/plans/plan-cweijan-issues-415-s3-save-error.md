# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/415](https://github.com/cweijan/vscode-office/issues/415)

## 标题

[BUG] Error When Saving to S3 Using AWS Toolkit for VSCode

## 标签

bug

## 问题描述

环境:OS: all,扩展版本 3.5.4(2025-07-02 提交)。

用户在 AWS Toolkit for VSCode 中打开存储于 Amazon S3 上的 `.xlsx` 文件进行编辑,修改内容后保存时报错。正文给出的复现步骤:

1. 打开 AWS Toolkit for VSCode;
2. 导航到 S3 存储桶并找到目标 `.xlsx` 文件;
3. 打开该文件进行编辑;
4. 修改内容后保存。

保存时弹出错误对话框:

```
Unable to open S3 file, try reopening from the explorer.
```

该文案来自 AWS Toolkit 自身,说明 S3 文件的打开/保存链路在本扩展接管 `*.xlsx` 自定义编辑器后被破坏。

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

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
