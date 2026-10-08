# _tmp/ — issue 处理过程的临时验证脚本存档

处理 issue 157(嵌套表格)与 226(kbd 标签)的根因定位时,lute.min.js(vditor 内置的
Markdown 解析器,Go 实现经 GopherJS 转译的黑盒产物)无法断点调试,因此用 node 直接
驱动它做了最小化实测。**验证结论均已写入
[docs/plans/done/](../../docs/plans/done/) 对应 plan**(226 的 plan 明确记载
「已用 node 直接驱动 global.Lute 实测确认」);脚本本身保留在此,作为验证手法的实证,
供后续 lute 相关 issue(如 cweijan-598 表格内公式)复用。

| 文件 | 用途 | 对应 issue |
| --- | --- | --- |
| `_tmp_lute_harness.js` | 通用骨架:按编辑器产品参数(VditorWYSIWYG 全套配置)构造 Lute 实例,探测往返行为 | 226(通用) |
| `_tmp_lute_api.js` | 列出 Lute 静态/实例 API,入口发现 | 226(通用) |
| `_tmp_lute_157_shapes.js` | 多形态文档 Md→DOM→Md 与 Spin 往返 | 157 |
| `_tmp_lute_li_matrix.js` | 列表(li)子节点序列化矩阵 | 157 |
| `_tmp_lute_226_heading.js` | heading + html-inline 往返 | 226 |
| `_tmp_lute_226_ir.js` | 同批用例在 IR 模式下的行为 | 226 / 157 |
| `_tmp_lute_226_paste.js` | HTML2VditorDOM 粘贴链路的 kbd 处理 | 226 |
| `_tmp_lute_paste_matrix.js` | 粘贴链路保留哪些行内元素 | 226 |
| `_tmp_browser_226.html` | 浏览器验证页(连 vite dev server 的 vditor dist,复现真实编辑器环境) | 226 |
| `_tmp_atom_extract.js` | 逆向 lute.min.js 的 GopherJS 字符串表(FNV 哈希),在黑盒产物内定位 table/li 等标签处理函数 | 157(黑盒分析) |

运行方式(需先 `npm run dev` 或 `npm run build` 产出 `vditor/dist/`):

```bash
node test-workspace/_tmp/_tmp_lute_harness.js
```

另含压缩包查看器功能测试的残留(`_tmp.tar`、`_tmp.tgz`、`_7z_staging/`、`_tar_staging/`,
来历 plan 未记载),一并移入本目录归档。
