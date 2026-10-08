<!-- issue: https://github.com/cweijan/vscode-office/issues/295
     现象: 按回车或执行其他操作后, 文档中的图片消失(v3.1.8, Windows, 2024-02 报告;
     交互类 bug, 本文件仅为操作载体, 复现步骤见 docs/plans/plan-cweijan-issues-295-image-disappear.md) -->

# 图片消失复现(issue-295)

第一段文字。下方是一张 PNG,请把光标放在本段末尾按回车,观察图片是否消失。

![本地 PNG 图片](../image/sample.png)

图片与下一段之间执行回车/输入:

![本地 JPG 图片](../image/sample.jpg)

第二段文字结束。下方是 GIF,在其前后分别按回车试试。

![本地 GIF 动画](../image/sample.gif)

结尾段落。切换预览/编辑模式再切回,检查上面三张图是否仍在。

- 列表项中的图片引用:

![列表后 PNG](../image/sample.png)
