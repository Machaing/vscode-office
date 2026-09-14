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

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
