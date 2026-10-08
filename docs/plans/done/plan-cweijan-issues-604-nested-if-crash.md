# issue信息

## issue链接

https://github.com/cweijan/vscode-office/issues/604

## 标题

[BUG] xlsx viewer crashes ("Cannot read properties of undefined (reading '0')") on IF nested 3+ levels deep

## 标签

(无标签)(报告者 adrianbarbuio,创建于 2026-09-09,当前 open)

## 问题描述-原文

## Summary

Opening an .xlsx that contains a formula with `IF` nested **three or more levels deep** fails with:

```
Failed to open file
Cannot read properties of undefined (reading '0')
```

Rendering stops at the first such cell (rows above it draw normally, rows below are blank) and the other sheet tabs never appear. The same file opens fine in Excel, Numbers and Google Sheets, and loads with openpyxl.

## Minimal repro

New workbook, `A1` = `M`, `B1` =

```
=IF(A1="S",1,IF(A1="M",3,IF(A1="L",5,0)))
```

→ error above.

Same cell with 2-deep nesting works:

```
=IF(A1="S",1,IF(A1="M",3,0))
```

Also fine (so it's the nesting depth, not these constructs): plain refs (`=A1`), absolute refs (`=$E$5`), string comparison, `UPPER()`, `""` comparisons, string-typed else branches, shared-formula encoding (`<f t="shared" si="…"/>`), cross-sheet references on other sheets.

Bisected by stripping every other formula from a real workbook and re-adding one construct at a time.

## Likely related

- #592 — formulas are evaluated by the viewer rather than using the cached `<v>` value (in the same file, `=IF($G$7="x","A","B")` renders as `0` instead of the cached string). Falling back to the cached value when evaluation throws would avoid the crash entirely.
- #576 — same error class on open.

## Environment

- OS: macOS (Darwin 25.6)
- VS Code + Office Viewer (cweijan.vscode-office), current marketplace version

## 问题评论信息

无评论

## 问题描述-中文

### 概述(Summary)

打开包含 `IF` 嵌套**三层及以上**公式的 `.xlsx` 失败,报错:

```
Failed to open file
Cannot read properties of undefined (reading '0')
```

渲染停在此类单元格的第一个(其上方行正常绘制,下方空白),其余 sheet 标签页不再出现。同一文件在 Excel、Numbers 和 Google Sheets 中打开正常,openpyxl 也能加载。

### 最小复现(Minimal repro)

新建工作簿,`A1` = `M`,`B1` =

```
=IF(A1="S",1,IF(A1="M",3,IF(A1="L",5,0)))
```

→ 报上述错误。

同一单元格改为 2 层嵌套则正常:

```
=IF(A1="S",1,IF(A1="M",3,0))
```

以下构造也正常(所以是嵌套深度的问题,而非这些构造本身): 普通引用(`=A1`)、绝对引用(`=$E$5`)、字符串比较、`UPPER()`、`""` 比较、字符串类型的 else 分支、共享公式编码(`<f t="shared" si="…"/>`)、其他 sheet 上的跨 sheet 引用。

通过从真实工作簿中剥离其余全部公式、再逐个构造重新添加的方式完成二分定位。

### 可能相关(Likely related)

- [#592](https://github.com/cweijan/vscode-office/issues/592) "[BUG] xlsx 查看器打开含绝对引用的公式(如 =E6/$E$9)显示 NaN%,未使用文件中已有的缓存计算结果"(当前 open)——公式由查看器自行求值而非使用缓存 `<v>` 值(同一文件中 `=IF($G$7="x","A","B")` 显示 `0` 而非缓存字符串)。求值抛错时回退缓存值可完全避免本崩溃。
- [#576](https://github.com/cweijan/vscode-office/issues/576) "[BUG]Cannot read properties of undefined (reading 'sheets')"(当前 open)——打开时同类 `undefined` 错误。

### 环境(Environment)

- 操作系统: macOS(Darwin 25.6)
- VS Code + Office Viewer(cweijan.vscode-office),marketplace 当前版本

## 问题评论信息-中文

无

## 补充归纳(非原文)

(本仓库归纳,非 issue 原文:)

- 报告者写在正文中的排除清单与二分定位叙述属原文,已保留在原文节;
- #592、#576 在本仓库已有处理 plan 并归档: [plan-cweijan-issues-592-formula-percent-nan.md](../done/plan-cweijan-issues-592-formula-percent-nan.md)、[plan-cweijan-issues-576-sheets-undefined.md](../done/plan-cweijan-issues-576-sheets-undefined.md)。

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

**已确认(以仓库真实源码 node 实测复现,堆栈与 issue 报错逐字一致)。** 崩溃点在 Excel 渲染兜底求值器 [cell.js](../../../src/react/view/excel/x-spreadsheet/core/cell.js) 的 `evalSuffixExpr`:后缀表达式栈中出现 `undefined` token,`const fc = expr[0]`([cell.js:152](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L152))对 undefined 取下标,抛 `TypeError: Cannot read properties of undefined (reading '0')`(实测堆栈: `evalSuffixExpr (cell.js:152)` ← `cellRender (cell.js:214)`)。

### 求值链路

打开文件 → `initSpreadsheet`([Excel.tsx:320-412](../../../src/react/view/excel/Excel.tsx#L320))→ `loadSheets`(reader 不做公式求值)→ `spreadSheet.loadData`([Excel.tsx:364](../../../src/react/view/excel/Excel.tsx#L364) → [index.ts:367-384](../../../src/react/view/excel/x-spreadsheet/index.ts#L367) 逐 sheet `resetData`)→ [sheet.js:1602](../../../src/react/view/excel/x-spreadsheet/component/sheet.js#L1602) `table.resetData` → [table.js:343-346](../../../src/react/view/excel/x-spreadsheet/component/table.js#L343) `render()` **同步**执行 → `renderCell` 中公式单元格且无 `formulaValue` 缓存时调用 `_cell.render`([table.js:97-104](../../../src/react/view/excel/x-spreadsheet/component/table.js#L97),#592 已让缓存值优先)→ `cellRender` → `infixExprToSuffixExpr`(中缀转后缀)+ `evalSuffixExpr`。求值器全仓库唯一调用点就是 table.js:101。

### 词法缺陷(上游 x-data-spreadsheet 原生,本 fork 与 upstream/main 该段一致)

`infixExprToSuffixExpr` 用**全表达式共享的单一状态**记录函数调用,不随括号分层:

- `fnArgType` / `fnArgsLen` 各只有一个([cell.js:12-13](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L12)),`,` 使 `fnArgsLen` 无条件 +1([cell.js:82-87](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L82)),统计的是**整条公式的逗号总数**而非当前函数的参数数;
- `)` 处理([cell.js:39-70](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L39)):先 `operatorStack.pop()`(L40,**无空栈保护**)。若闭括号前是参数(`fnArgType` 为 1/3)→ 弹出函数名连同全局 `fnArgsLen` 组成 `[fn, n]` 输出(L58-61);若 `fnArgType===0`(典型: `))` 相邻,前一个 `)` 已在 L71 把它复位)→ flush 循环(L63-69)把剩余函数名当**裸字符串**输出,循环内 `stack.push(c1)` 在 `c1` 为 pop 出的 `undefined` 时照样执行(L65-68)。

### 3 层嵌套逐步推演(`IF(A1="S",1,IF(A1="M",3,IF(A1="L",5,0)))`)

1. 3 个 `(` 依次向 operatorStack 压入 3 个 `IF`;6 个 `,` 把 `fnArgsLen` 累计到 7(与实际最内层参数数 3 无关);
2. 第 1 个 `)`(最内层,前 token 是 `,`,`fnArgType=1`):弹出内层 `IF`,输出 `['IF', 7]`,`fnArgType` 复位 0;
3. 第 2 个 `)`(`fnArgType=0`):走 flush 循环,把剩余 **2 个** `IF` 全部作为裸字符串输出,operatorStack 清空;
4. 第 3 个 `)`:`operatorStack.pop()` → **undefined**;`while (undefined !== '(')` 成立 → `stack.push(undefined)` 后 break → `undefined` 混入后缀表达式;
5. `evalSuffixExpr` 逐 token 执行到该 `undefined`,[cell.js:152](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L152) `expr[0]` 抛错。

实测后缀序列(直接运行仓库 cell.js):

| 公式 | 后缀序列尾部 | render 结果 |
| --- | --- | --- |
| 1 层 `=IF(A1="M",3,0)` | `..., "0", ["IF",3]` | `0`(不崩,值错,见下) |
| 2 层 | `..., "0", ["IF",5], "IF"` | `false`(不崩) |
| 3 层 | `..., "0", ["IF",7], "IF", "IF", undefined` | **TypeError: Cannot read properties of undefined (reading '0')** |
| 4 层 | `..., ["IF",9], "IF", "IF", "IF", undefined, undefined` | 同上崩溃 |

### 为什么恰好 3 层触发而 2 层正常

N 层嵌套产生 N 个函数名与 N 个**连续** `)`:最内层 `)` 以函数调用形式消耗 1 个,第 2 个 `)` 的 flush 循环**一次性**耗尽其余 N-1 个,此后第 3..N 个 `)`(共 N-2 个)每次都 pop 到空栈、各压入 1 个 `undefined`。N=1 干净;N=2 时"函数名恰好只剩 1 个、`)` 恰好只剩 1 个",flush 后栈空但无多余 `)`——多出的裸 `'IF'` 被求值器当作列引用(约第 240 列、行 NaN),`getCellText` 对空单元格返回 `''`([table.js:101-104](../../../src/react/view/excel/x-spreadsheet/component/table.js#L101)),`1*''`→0 静默吞掉,结果取 `stack[0]` 不受影响;N≥3 必现 `undefined` → 崩溃。即 2 层恰好落在"闭括号数=可消耗的函数名数"的临界点上,是典型的边界 off-by-one。

### 为何整份文件打开失败

渲染链全程同步且无逐单元格兜底: `renderCell` 的异常沿 `renderContent` → `Table.render` → `resetData` → `loadData` → `initSpreadsheet` 的 try/catch([Excel.tsx:420-428](../../../src/react/view/excel/Excel.tsx#L420))上传,`setLoadError` → 全屏 "Failed to open file" 面板([Excel.tsx:458-470](../../../src/react/view/excel/Excel.tsx#L458),i18n `viewer.failedOpenFile`)。且 `setLoading(false)` 先于 `loadData`([Excel.tsx:363-364](../../../src/react/view/excel/Excel.tsx#L363)),崩溃时已绘制的上方行留在画布上——与 issue 描述"停在该单元格、上方行正常、下方空白、其余 sheet 标签不出现"吻合。

### 与 #592 / 上游的关系

- 本 fork table.js:97-99 已让 `formulaValue`(缓存 `<v>`)优先于求值,带缓存单元格(复现文件 C1)不进求值器不崩溃;**无缓存**单元格(openpyxl 等工具产出,B1)仍崩——本 fork 可复现 issue。
- upstream/main 的 table.js 无缓存优先(无条件 `_cell.render`),故 marketplace 版无论有无缓存都崩;reporter 的最小复现文件由工具重建(无 `<v>`),两种版本均命中。
- **附带发现(独立缺陷,非本根因但影响期望值)**: 即使不崩,该求值器字符串比较结果也是错的——`evalSubExpr` 以 `ret * cellRender(x,y)`([cell.js:139](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L139))把字符串单元格乘成 NaN,比较时 `Number('M')`→NaN、`NaN===NaN`→false([cell.js:169-176](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L169)),实测 1 层显示 `0`、2 层显示 `false`(均应为 3)。即"只修嵌套解析"仍得不到正确值。

## 修复方案

**推荐先落方向 ②(单元格级兜底),方向 ① 作为后续增强单独处理。**

### 方向 ②: 求值抛错时单元格级回退(推荐,本次)

[table.js](../../../src/react/view/excel/x-spreadsheet/component/table.js) `renderCell` L100-104 把 `_cell.render(...)` 包进 try/catch:

```js
} else if (!data.settings.evalPaused) {
  try {
    cellText = _cell.render(cell.text || '', formulam, (y, x) => { ... });
  } catch (e) {
    console.warn(`formula eval failed at ${rindex},${cindex}: ${cell.text}`, e);
    cellText = '#VALUE!';   // Excel 风格错误值;cell.text 仍在数据层,双击编辑不受影响
  }
}
```

- **效果**: 单个公式求值失败只影响该格显示,文件正常打开;与 #592 的 `formulaValue` 主路径互补——有缓存显示正确值,无缓存显示 `#VALUE!` 而非整文件失败;天然兜住求值器未来任何解析 bug(初始加载、滚动重绘、主题/缩放 reRender 全走这一个 choke point)。
- **风险**: 极低。只新增 catch 分支,正常路径(缓存优先、求值成功)零改动;`formatter.render`(L108-111)留在 try 外不受影响。

### 方向 ①: 求值引擎修复嵌套调用(增强项,独立跟进)

- **①-最小防御**: [cell.js](../../../src/react/view/excel/x-spreadsheet/core/cell.js) L39-70 对 `operatorStack.pop()` 判 undefined(空栈时忽略该 `)`),L152 前跳过 undefined token。可阻止 `undefined` 进栈 → 不再崩溃;但嵌套 IF 求值结果仍错(全局 `fnArgsLen` 使 `['IF',2N+1]` 参数计数错误、裸 `'IF'` 残留),字符串比较缺陷依旧,B1 不会显示 3。低风险但收益有限。
- **①-完整修复**: 把 `fnArgType`/`fnArgsLen` 单计数器改为随 `(` 压栈的**每层调用帧**(函数名+各自参数计数+argType),`)` 弹出对应帧生成 `[fn, n]`;同时修 [cell.js:139](../../../src/react/view/excel/x-spreadsheet/core/cell.js#L139)(字符串单元格值不做 `ret *` 乘法)与 L169-176(类型感知比较)。这是对上游遗留算法的结构性改写,影响所有公式(SUM 区间 `fnArgType===2`、一元负号、运算符优先级、#592 刚修的 `$` 分词),仓库无测试框架,回归面大。
- **推荐组合**: 本次仅落 ②;①-完整连同字符串比较语义另开 plan,配合 `sample.xlsx` 全量公式显示 diff 回归。仅当文件带缓存 `<v>` 时 ② 已满足"B1 显示 3"的期望。

## 验证方式

1. **主复现**(`test-excel-cweijan-604-nested-if-crash.xlsx`,对应上方复现步骤 1-2):
   - 打开文件: 修复前 → 全屏 `Failed to open file: Cannot read properties of undefined (reading '0')`,画布停在 B1 上方、无 sheet 标签;修复后 → 正常打开,整表与底部 sheet 标签完整渲染;
   - `B1`(3 层,无缓存): 修复前触发崩溃;修复后显示 `#VALUE!`(或所选回退串),console.warn 含行列定位,渲染不中断;
   - `C1`(3 层,注入缓存 `<v>3</v>`): 修复前后均显示 `3`(#592 `formulaValue` 主路径,求值器不执行)——确认 ② 不改动该路径;
   - `D1`/`E1`(2/1 层对照): 修复前后行为一致(不崩;受既有字符串比较缺陷影响显示 `false`/`0` 而非 `3`,属方向 ① 的已知限制)——确认无回归;
   - 第 2 行(`A2`=`S`/`L` 分支)同结构逐格核对,同上预期。
2. **单元级(可选,临时脚本同 #592 验证手法)**: node 直接运行 cell.js——3/4 层公式 `render` 不再抛错(② 生效;若同时落 ①-最小防御则后缀序列不再含 `undefined`);1/2 层后缀序列与求值结果与修复前完全一致。
3. **回归**:
   - `sample.xlsx` / `sample.xlsm`(公式无缓存走求值器): 全部公式显示与修复前 diff 为零(② 不改求值路径);
   - `test-excel-cweijan-592-formula-percent-nan.xlsx`: F6/F7/F8/F9 → `27.4%`/`47.6%`/`25.0%`/`100.0%`、E9 → `84`、G15 → `25`,不变;
   - `test-excel-cweijan-576-sheets-undefined.xlsx`: 走既有解析兜底链,行为不变;
   - Excel/WPS 真实保存的含 3 层 IF 文件(自带 `<v>` 缓存): 显示缓存值,不进求值器。
4. **若跟进方向 ①**(任一档)需追加: 嵌套混合公式(`=SUM(A1,SUM(B1:B3),IF(C1>0,1,0))`)、区间 `A1:B5`、一元负号、`$` 绝对引用(#592 用例)的后缀序列与求值结果不劣化。

## 修复记录

- 2026-10-08 实施方向 ②并实测验证通过(`ef61b86`): [table.js](../../../src/react/view/excel/x-spreadsheet/component/table.js)
  `renderCell` 的 `_cell.render` 包 try/catch,失败格显示 `#VALUE!` 并 console.warn 行列定位;
  `formulaValue` 缓存优先与 `formatter.render` 均在 try 外,零改动。
- 实测结果(复现文件 F5,与上方验证预期逐项一致): 文件正常打开、整表与 sheet 标签完整渲染;
  `B1`(3 层无缓存)→ `#VALUE!`;`C1`(带缓存)→ `3`;`D1`/`E1` 对照与第 2 行分支无回归。
- 方向 ①(求值引擎嵌套调用帧、字符串比较语义)未实施,作为独立增强另行跟进
  (即使不修,B1 类无缓存格显示 `#VALUE!` 而非崩溃,文件可正常打开)。
