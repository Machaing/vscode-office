# issue信息

## issue链接

[github.com/cweijan/vscode-office/issues/604](https://github.com/cweijan/vscode-office/issues/604)

## 标题

[BUG] xlsx viewer crashes ("Cannot read properties of undefined (reading '0')") on IF nested 3+ levels deep

## 标签

(无标签,bug 报告)

## 问题描述

打开含 **3 层及以上嵌套 IF** 公式的 `.xlsx` 时报错:

```
Failed to open file
Cannot read properties of undefined (reading '0')
```

渲染停在该单元格(其上方行正常绘制,下方空白),其余 sheet 标签页不再出现。同一文件在 Excel、Numbers、Google Sheets 中正常打开,openpyxl 也能加载。

最小复现:新建工作簿,`A1` = `M`,`B1` =

```
=IF(A1="S",1,IF(A1="M",3,IF(A1="L",5,0)))
```

同单元格改为 2 层嵌套则正常:

```
=IF(A1="S",1,IF(A1="M",3,0))
```

报告者通过从真实工作簿逐个剥离公式再逐构造重加的方式二分定位,已排除以下构造(均正常,说明是嵌套深度问题而非这些构造本身):普通引用(`=A1`)、绝对引用(`=$E$5`)、字符串比较、`UPPER()`、`""` 比较、字符串类型的 else 分支、共享公式编码(`<f t="shared" si="…"/>`)、跨 sheet 引用。

### 相关 issue

- [#592](../done/plan-cweijan-issues-592-formula-percent-nan.md) — 查看器自行求值公式而未使用缓存 `<v>` 值(同文件中 `=IF($G$7="x","A","B")` 显示 `0` 而非缓存字符串)。求值抛错时回退缓存值可完全避免本崩溃。
- [#576](../done/plan-cweijan-issues-576-sheets-undefined.md) — 打开时同类 `undefined` 错误。

### 环境

- OS: macOS (Darwin 25.6)
- VS Code + Office Viewer (cweijan.vscode-office),marketplace 当前版本

## 期望行为

3 层嵌套 IF 正常计算显示(上例 `B1` 应显示 `3`);至少在公式求值失败时回退到缓存 `<v>` 值或给出可定位的错误提示,而不是让整个查看器打开失败。

## 实际行为

报 `Failed to open file: Cannot read properties of undefined (reading '0')`,渲染中断,后续行与其余 sheet 均不可见。

# 问题确认及解决

## 复现数据

复现文件: `test-workspace/excel/test-excel-cweijan-604-nested-if-crash.xlsx`
生成脚本: `test-workspace/_generate/issue_604_nested_if_crash.py`

文件内容说明: 单 Sheet 布局(基于 issue 最小复现扩展出对照列):

| 单元格 | 内容 | 作用 |
| --- | --- | --- |
| `A1` | `M` | 分支输入 |
| `B1` | `=IF(A1="S",1,IF(A1="M",3,IF(A1="L",5,0)))` | **核心复现**: 3 层嵌套 IF,openpyxl 原生输出(无缓存 `<v>`) |
| `C1` | 同 B1 公式,但经 zipfile 后处理注入缓存值 `<v>3</v>` | 贴近 Excel/WPS 保存的真实文件,验证"有缓存值时是否仍崩溃/是否可 fallback"(呼应 #592) |
| `D1` | `=IF(A1="S",1,IF(A1="M",3,0))` | 2 层嵌套对照(issue 报告正常) |
| `E1` | `=IF(A1="M",3,0)` | 1 层嵌套对照 |

第 2 行将 `A2` 设为 `S`、`L` 复制同组公式,覆盖不同分支命中(else 链深处取值)的情形。

### 复现步骤

1. F5 调起扩展调试,打开 `test-excel-cweijan-604-nested-if-crash.xlsx`;
2. 观察打开结果;
3. 预期: `B1/C1` 显示 `3`(或至少 C1 用缓存值正常显示),`D1/E1` 显示 `3`/`3`;
   实际(按 issue): 打开即报 `Cannot read properties of undefined (reading '0')`,整个文件渲染失败。

## 根因定位

{待分析}(初步线索: 查看器内公式求值引擎对 3 层以上嵌套函数调用抛错且无兜底,结合 #592 的"自行求值不走缓存值"行为;求值入口大概率在 excel 渲染链路的公式解析/求值模块,`reading '0'` 疑似对某层数组/参数结构越界取值)

## 修复方案

{待分析}(候选方向: ① 求值引擎修复嵌套调用; ② 求值抛错时回退单元格缓存 `<v>` 值,#592 一并受益)

## 验证方式

{待分析}(基线: 上述复现步骤;回归: `sample.xlsx` 与 #592 复现文件的公式显示不受影响)
