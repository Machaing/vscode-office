# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/405](https://github.com/cweijan/vscode-office/issues/405)

## 标题

[BUG] placeholder instead of image in markdown viewer

## 标签

bug

## 问题描述

- 环境: Windows 11,Extension Version 3.5.4(报告人 kyell182,2025-05-01 提交);
- 现象: 在 markdown viewer 中打开预览时,图片位置只显示占位符(placeholder),不会渲染出实际图像;
- 对照: 同一图片在其他预览器(如 VS Code 内置 Markdown 预览或其他扩展)中可以正常显示;
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

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
