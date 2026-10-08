# issue 571：代码块内各行文字挤在一起

## 无语言标注代码块

```
第一行文字
第二行文字
第三行文字
第四行文字
```

## JavaScript

```js
function greet(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
  return message;
}
```

## Python

```python
def calculate(a, b):
    total = a + b
    print(f"total = {total}")
    return total
```

## JSON

```json
{
  "name": "vscode-office",
  "version": "4.2.0",
  "platform": ["desktop", "web"]
}
```

## 中英文混排与空行

```text
第一行 First line
第二行 Second line

第四行 Fourth line
第五行 Fifth line
```
