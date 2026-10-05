# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/308](https://github.com/cweijan/vscode-office/issues/308)

## 标题

给图片重命名

## 标签

bug

## 问题描述

用户通过设置 `vscode-office.pasterImgPath`(上游旧版为 `office.pasterImgPath`)自定义 Markdown 粘贴/上传图片的命名规则,规则中使用了**两个** `${fileName}` 变量:

```
${fileName}imags/${fileName}imags${now}.png
```

粘贴图片后,第二个 `${fileName}` 变量没有被替换,以字面量形式残留在最终生成的文件名中。用户原话:"The second "${fileName}" variable does not work, and I don't know why."

环境:OS 与扩展版本均未填写(2024-04-21 提交)。

## 期望行为

命名规则中出现的所有 `${fileName}` 占位符(含第二个及以后)都被替换为当前 md 文件名(去除空白字符),与设置项描述的变量语义一致;用户期望的命名效果是「当前文件名 + 当前时间」,例如 `航苏STM32预imags2024-04-21-11-07-37.png`。

## 实际行为

仅第一个 `${fileName}` 被替换,后续出现的 `${fileName}` 原样保留在文件名中。issue 附图(4 张截图)显示实际生成的文件名形如:

```
${fileName}imags1713670793753.png
```

即 `${now}` 已展开为时间戳,而 `${fileName}` 以字面量残留在文件名里。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/markdown/test-markdown-cweijan-308-image-rename-variable.md`
生成脚本: 文本文件,直接维护

文件内容说明: 最小 Markdown 载体,含标题、一段正文、一个既有图片引用和一行提示,用于在 Markdown 编辑器中执行粘贴图片操作,观察磁盘上生成的图片文件名。

### 复现步骤

1. F5 调起扩展调试,打开复现文件;
2. 将设置 `vscode-office.pasterImgPath` 改为含两个 `${fileName}` 的规则,例如 `${fileName}-images/${fileName}-${now}.${ext}`;
3. 复制一张图片(如截图)后,在 Markdown 编辑器正文中 Ctrl+V 粘贴;
4. 预期: 生成的图片文件名中所有 `${fileName}` 均被替换为当前文件名 `test-markdown-cweijan-308-image-rename-variable`;实际: 仅第一个被替换,第二个 `${fileName}` 以字面量残留在文件名与插入的图片引用中(与 issue 现象一致)。

## 根因定位

{待分析}

## 修复方案

{待分析}

## 验证方式

{待分析}
