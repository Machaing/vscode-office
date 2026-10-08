<!-- issue: https://github.com/cweijan/vscode-office/issues/405
     现象: markdown viewer 中图片仅显示占位符不渲染,其他预览器正常(ext 3.5.4, Win11) -->

# 图片渲染复现(issue-405)

本地相对路径图片:

![本地 PNG 图片](../image/sample.png)

外链图片:

![外链 SVG 图片](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

对照文本: 若上方两张图片均渲染出实际图像,则本 issue 未复现。
