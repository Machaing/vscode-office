# probe: category 1 hr

---

above text

***

- - -

text before setext

# probe: category 2 escaped bold

text**《重要说明》**后续文字。

plain**bold**plain

**bold with 《》 inside**

# probe: category 3 underscore

变量名 user_profile 与 another_var_name 应保持原样。

snake_case_name _italic_ mixed

_italic text here_

__strong underline__

a _ b _ c

# probe: category 4 tight list

- 列表项一
- 列表项二
- 列表项三

1. one
2. two
3. three

- 列表项一
- 列表项二

  嵌套段落

- 另一个列表

# probe: category 5 table

| 名称  | 说明         | 数量 |
| ----- | ------------ | ---- |
| alpha | 第一项说明   | 1    |
| beta  | 第二项说明   | 22   |
| gamma | 第三项中文说明 | 333  |

|left|center|right|
|:---|:---:|---:|
|a|b|c|

# probe: category 6 bold with inline code

这是 **粗体包含 `code` 片段** 的文字，相邻文本不应被吞掉。

**bold `code` tail**

**bold *nested italic* bold**

# probe: controls

普通纯文本段落。

## 标题二

```text
user_profile and --- inside code block
**not bold** here
```

行内代码 `user_profile` 与 `---`。

    indented code block
    stays as is

> 引用块
> 第二行

[link](http://example.com) and ![img](image.png)

***bold italic*** text

终行。
