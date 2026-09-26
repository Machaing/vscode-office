# Pro 收费功能设计

> 创建: 2026-09-26 · 状态: 设计讨论稿(原始设想已保留并展开,标注 `[待定]` 的为需要拍板的决策点)
> 本文档回答两个问题: ① 什么时候、对哪些功能提示收费升级; ② 怎么收钱(渠道/发码/激活)。

## 〇、原始设想(2026-09-26 草稿)

1. Pro 升级提示时机: 同类型文件预览打开 >1 个时提示升级;另外考察哪些进阶功能可以放入 Pro
2. 收费方式: 国内支持微信/支付宝,国外支持 PayPal

## 一、设计前提与约束

在展开方案前,先明确三个绕不开的现实约束:

1. **仓库源码公开**。本仓库 fork 自 cweijan/vscode-office 且公开在 GitHub,任何收费校验逻辑用户都能看到并自行编译绕过。对策不是追求绝对防破解(做不到),而是:
   - 接受一定破解率,把校验做得"绕过有门槛、正常用户无感知";
   - 正版价值锚定在 **自动更新 + 优先 issue 支持 + 试用新功能** 上,而非代码本身;
   - 若后续决定 Pro 模块闭源,可将验证逻辑抽为独立包在构建时混淆注入(见 4.5),但 MVP 不建议走这步。
2. **Marketplace 无付费机制**。VS Code Marketplace 不支持直接售卖扩展,通行且被广泛接受的做法是: 扩展免费上架 + 官网/外部渠道购买 license key 激活 Pro(GitLens 的 freemium 即先例)。README/更新日志中可以介绍 Pro,但不能做成硬广告。
3. **fork 的口碑定位**。本 fork 的卖点是"faster bug fixes"(README 原话),增长靠口碑。**限制策略宁软勿硬**——硬限制(打不开/不能用)是差评的头号来源,一次差评的损失大于数十个转化。

## 二、什么时候提示升级(原始问题 ①)

### 2.1 「同类型预览打开 >1 个时提示」的评估

| 维度 | 评估 |
| --- | --- |
| 用户场景冲突 | 开发者常态就是并排开两个 excel 对比、两个 md 对照编写。第 2 个同类文件就触发提示,命中率极高但**几乎全是误伤** |
| 若做成硬限制(第 2 个不让开) | 直接差评+卸载,重灾区。不推荐 |
| 若做成软提示(能开,弹一次横幅) | 可接受。触发点天然、信号强(说明用户重度使用该类查看器) |

**结论**: 该设想**保留为"提示触发点"而不是"限制点"**——同类型预览打开第 2 个时展示一次可关闭的升级横幅(带频控),功能完全不受限。真正的付费墙放在功能分级上。

### 2.2 提示时机的整体设计

推荐 **「全功能试用期 + 功能分级」** 组合(业界主流,GitLens/GitKraken 同款思路):

1. **试用期**: 首次激活扩展起 30 天全功能免费试用 `[待定:天数]`,试用期内不弹任何升级提示,只在临近到期(剩 7/3/1 天)时状态栏轻提示。
2. **到期后**: 基础功能(见 2.3 分级表)永久免费;Pro 功能锁定,触发时弹出升级对话框。
3. **升级横幅触发点**(频控: 每个触发点每 7 天最多 1 次,对话框类每天最多 1 次):
   - 使用 Pro 功能被拦截时(必须提示,给"输入许可证/去购买"两个入口)
   - 同类型预览打开 >1 个时(软提示,见 2.1)
   - 命令面板手动查看(`office.pro.status` 命令,随时可看授权状态/试用剩余天数)

### 2.3 免费 / Pro 功能分级建议

原则: **查看永远免费(口碑与装机量基础);编辑基础免费;导出链路、编辑保存、新增重型功能进 Pro**。基于当前功能清单(详见下表,"实现"列为主要入口文件):

| 模块 | 功能 | 建议 | 理由 |
| --- | --- | --- | --- |
| 查看器全家 | excel/word/ppt/pdf/epub/font/psd/xmind/image/svg/html/parquet/icns 查看 | **免费** | 装机量与口碑的根基,收费等于把用户推回上游 |
| Markdown | WYSIWYG 编辑、大纲、主题、贴图、WikiLink | 基础**免费**(WikiLink `[待定]`) | 编辑器是高频日常,动了必差评 |
| Markdown | 导出 PDF / DOCX / HTML(puppeteer 链路,`src/service/markdown/`) | **Pro** | 高感知、低频刚需,最经典的付费点;Web 版本就不支持,口径统一 |
| Excel | 查看、单元格编辑、格式化 | **免费** | 日常高频 |
| Excel | 另存为(xlsx/xls/csv/ods,`excel_writer.ts` 的 exportSaveAs) | **Pro** | 保存回原格式免费,**另存/转换**收费,边界清晰不误伤日常 |
| Word | 查看、批注、编辑并保存回 docx(`src/react/view/word/`) | 编辑保存 **Pro** `[待定]` | docx 编辑是本扩展稀缺能力,价值高;但"能看不能存"体验割裂,需权衡 |
| Parquet | 查看 + 写回(`src/service/parquet/parquetUtil.ts`) | 写回 **Pro** | 小众但刚需,愿意用的人付费意愿高 |
| XMind | 查看 + 编辑保存(`src/react/view/xmind/`) | 编辑保存 **Pro** | 同上 |
| SVG | 源码编辑、导出 PNG(`src/react/view/svg/`) | **免费** | 小功能,收费显得抠门 |
| HTTP Client(`src/provider/http/`) | 全部 | **免费** `[待定]` | 免费竞品(REST Client)体验成熟,收费只会把用户送走 |
| Git History(`src/gitHistory/`) | 全部 | **免费** `[待定]` | 同上,git-graph 等免费替代多;留作口碑功能 |
| Java 反编译(`resource/java-decompiler.jar`) | `.class` 反编译 | **Pro** `[待定]` | 受众窄、刚需强、无好的免费替代,转化率高 |
| 压缩包查看器 | 浏览/解压 | **免费** | 基础能力 |
| 压缩包查看器 | zip 增编(addFile/removeFile 直接改包,`zipHandler.ts`) | **Pro** `[待定]` | 进阶能力,边界自然 |
| AI 润色(`src/service/ai/`) | 全部 | **Pro** | 新功能无历史包袱,天然 Pro 位 |

> **老用户条款(grandfathering)**: 已发布为免费的功能若转为 Pro,极易引发老用户反弹。建议规则: **收费版本发布前已安装的用户,其当时已免费的功保持免费**(按 globalState 首次激活时间判断);Pro 只对收费版发布后的新用户生效。AI 润色等新功能无此问题。

### 2.4 提示 UI 形式

全部走现有 webview 体系(React 组件 + `Handler` 消息),复用 i18n(11 种语言全量补齐,`src/react/i18n/messages/`):

1. **ProBanner**(非阻断): webview 顶部细横幅,"升级到 Pro"按钮 + 关闭 ×,用于 2.1 的软提示
2. **UpgradeDialog**(阻断但克制): 触发付费墙时弹出,含功能说明、价格、"输入许可证密钥"输入框、"去购买"(打开外部 URL)三个动作
3. **状态栏项**: 试用期剩余天数 / Pro 已激活标识(可点击进入 `office.pro.status`)
4. 扩展宿主侧命令: `office.pro.activate`(输入密钥)、`office.pro.status`(查看状态)、`office.pro.buy`(打开购买页)

## 三、收费方式(原始问题 ②)

### 3.1 商业模式 `[待定]`

| 模式 | 说明 | 适合度 |
| --- | --- | --- |
| **一次性买断(推荐)** | 单人授权,绑定 3 台设备,含 1 年功能更新(到期可继续用已获得版本) | 工具类扩展接受度最高,定价心理门槛低,客服最简单 |
| 订阅制 | 年付,持续更新 | 收入可预期但个人工具订阅差评率高,催续费体验差 |
| 双轨 | 个人买断 + 商业(公司)订阅 | 后期演进方向,MVP 不做 |

**推荐买断制**,定价参考同类工具型扩展: ¥49~68 / $9.9~14.9 `[待定]`,国内国外同价不同币种。

### 3.2 支付渠道对比与推荐

国内个人主体**无法**直接申请网站收单(需公司+ICP 备案),必须借助平台;国外首选 Merchant of Record(代缴全球税,个人友好):

| 渠道 | 覆盖 | 费率 | 特点 |
| --- | --- | --- | --- |
| **Paddle** | PayPal、信用卡、Apple/Google Pay、**支付宝**(含订阅) | ~5% + $0.50 | MoR 代缴税;**唯一同时覆盖 PayPal+支付宝的主流平台**,个人可申请;自带 license 发放 API |
| Lemon Squeezy | 信用卡、PayPal | ~5% + $0.50 | 内置 license key 管理(激活/验证/设备数)开箱即用,但**不支持支付宝** |
| Polar | 信用卡、PayPal | ~4% + $0.40 | 开源生态友好,增长快 |
| 虎皮椒(xunhupay) | 微信、支付宝 | ~2.38% | 个人可用、无需营业执照;需自备发码流程;开通收费 |
| 爱发电 / 面包多 | 支付宝、微信 | 平台抽成 | 数字商品可自动发货(发激活码),起步最省事,但"赞助/平台"属性对商业售卖不够正式 |
| PayPal 直连 | PayPal | ~4.4%+固定费 | 需要商业账号与自建回调,不推荐 MVP 做 |

**推荐组合** `[待定]`:

- **MVP(最小可行)**: 只接 **Paddle** 一个平台 —— 国外用户 PayPal/信用卡、国内用户支付宝,一次接入全解决,税务由平台兜底。微信用户暂引导走支付宝。
- **二期**: 微信支付补虎皮椒(或爱发电自动发货),补齐微信人群。
- 发码链路: Paddle 购买成功 → 用其 license API 自动发码(或 webhook 回调到自签名脚本),见 3.3。

### 3.3 License Key(许可证密钥)机制

**格式(离线签名方案,不依赖自建服务器)**:

```
OVPRO-<base32(Ed25519 签名载荷)>-<base32(签名)>
载荷(payload,紧凑 JSON/CBOR): { 产品标识, 类型: pro/trial, 授权邮箱哈希, 设备上限, 过期时间|主版本号 }
```

- 私钥本地保管(仅用于发码脚本),**公钥硬编码进扩展**,激活时本地 `Ed25519.verify` 验签 —— 无服务器、无网络依赖、离线可用;
- 签名库双端兼容: 桌面(node:crypto)与 Web(build.ts 的 node-shim)需一致,直接用纯 JS 实现(如 `tweetnacl`)最省心;
- **设备绑定**: 不用 `vscode.env.machineId`(关闭遥测的机器上它退化为固定值,不可靠),改为首次激活时生成随机 UUID 存 globalState 作为机器标识;激活时把 UUID 混入在线激活记录(Paddle/LS 的 license API 自带设备数管理,直接用平台的即可,无需自建);
- **存储**: 密钥本体存 `SecretStorage`(VS Code 加密存储),解密后的授权状态缓存到 globalState;`office.pro.status` 随时重验。

**激活流程**: 命令面板/升级对话框输入密钥 → 本地验签 → (在线平台则调 license activation API 绑定设备) → 存 SecretStorage → 全部已打开 webview 广播 `proStateChanged` 刷新 UI。

**发码流程(MVP)**: Paddle 后台配置商品 → 购买 webhook/平台 license API 自动发码;若先不接 webhook,也可"收款邮件 + 本地发码脚本半自动发",量小时完全够用。

### 3.4 退款与合规

- Paddle/Lemon Squeezy 作为 MoR 处理增值税/销售税,个人无需操心;
- 退款政策写明(如 14 天无理由),Paddle 后台可一键退;
- README 增加 "Pro & License" 小节说明授权条款(设备数、更新期、退款),避免纠纷。

## 四、技术实现方案

### 4.1 新增模块

```
src/service/license/
├── licenseService.ts   # 状态机: free | trial | pro;暴露 getState()/isPro(feature)/activate(key)
├── licenseKey.ts       # key 编解码 + Ed25519 验签(tweetnacl)
└── proGate.ts          # 功能闸门: feature id → 检查 → 放行/抛 ProRequired 事件
scripts/gen-license.mjs # 发码脚本(私钥签名,不入仓库)
```

现状确认: 仓库目前**没有任何 license/激活基础设施**(src/ 下无相关代码),需从零引入;`TelemetryService` 是 no-op 空壳但调用点遍布,若要统计转化漏斗可顺手恢复实现(可选)。

### 4.2 功能闸门注入点

尽量**集中注入、少散点**,降低与上游同步时的冲突面(memory: upstream 只读参考、不 merge,但 issue 修复仍需经常对照上游代码):

- 宿主侧功能(Markdown 导出、Parquet 写回、Java 反编译、zip 增编): 在对应 service/provider 入口处统一调 `proGate.check('feature-id')`,不放行则发消息让 webview 弹 UpgradeDialog;
- webview 侧功能(Excel 另存、Word 保存、XMind 保存、AI 入口): `ReactApp.view` 注入 configs 时带上 `{ pro: state, lockedFeatures: [...] }`,webview 内 `usePro()` hook 判断;webview 内的判断可被 devtools 绕过,但对**保存动作**可在宿主侧 save/saveAs 通道(`src/provider/compress/commonHandler.ts`)再校验一次兜底——真正写文件的动作宿主说了算,这才是可靠的闸门。

### 4.3 试用期实现

- 首次 activate 时 `globalState` 记录安装时间戳,并用license 私钥无关的**服务端不可行的本地手段**防篡改: 时间戳连同 HMAC(内置随机盐)存入,每次启动校验;检测到系统时间回拨则冻结试用 `[待定:是否做,防君子不防小人]`;
- 卸载重装会清 globalState/SecretStorage,试用期可被重置 —— 明知且接受,不值得对抗。

### 4.4 桌面 / Web 双端

- 授权状态与激活流程两端共享同一套 `licenseService`(纯 JS 验签无 Node 依赖);
- Web 版(vscode.dev)同样生效: Pro 功能里 Markdown 导出 PDF/DOCX、Java 反编译、压缩包增编本来就不支持或仅桌面,实际 Web 端付费墙只剩 Excel 另存等少数点,口径在 README 说明清楚。

### 4.5 防绕过策略(开源仓库下的务实选择)

1. MVP: 验签逻辑明文在仓库,接受"自行编译者免费用"(这部分人本就不会付费);
2. 正版体验差异: 自动更新、issue 优先响应、Pro 设置同步(后续);
3. 若破解泛滥再升级: Pro 判定逻辑抽为独立混淆包,或关键导出链路(如 PDF 导出的 watermark/字体资源)在闭源包内提供。

## 五、实施分期

| 阶段 | 内容 | 依赖 |
| --- | --- | --- |
| P0 基础设施 | `licenseService` + 密钥验签 + SecretStorage + `office.pro.activate/status` 命令 + configs 注入 pro 状态;发码脚本 | 无 |
| P1 付费墙落地 | `proGate` 接入首批 Pro 功能(建议首发: Markdown 导出 PDF/DOCX + Java 反编译 + AI 润色) + ProBanner/UpgradeDialog + 试用期 + i18n 11 语言 | P0 |
| P2 收款上线 | Paddle 开户/商品配置 + 自动发码(webhook 或 license API) + README "Pro & License" 章节 + 购买落地页 | P1 功能定型 |
| P3 增长迭代 | 微信支付(虎皮椒/爱发电)、老用户 grandfather 判断、转化埋点(恢复 TelemetryService)、商业版双轨 | P2 运行数据 |

## 六、待定决策清单

| # | 决策点 | 推荐 |
| --- | --- | --- |
| 1 | 商业模式 | 一次性买断,¥49~68 / $9.9~14.9,3 台设备,1 年更新 |
| 2 | 试用期天数 | 30 天全功能 |
| 3 | 首批 Pro 功能 | Markdown 导出 PDF/DOCX + Java 反编译 + AI 润色 + Parquet 写回(边界最干净) |
| 4 | Word/Excel「编辑保存」是否进 Pro | Excel 另存收费、保存免费;Word 编辑保存进 Pro 但给老用户保留 |
| 5 | HTTP Client / Git History | 保持免费(免费竞品太强,收费=送客) |
| 6 | 收款渠道 | MVP 只接 Paddle;二期补微信(虎皮椒或爱发电) |
| 7 | 「同类预览 >1 个」提示 | 做成非阻断横幅(频控 7 天 1 次),不做硬限制 |

## 七、风险与对策

| 风险 | 对策 |
| --- | --- |
| 硬限制引发差评潮 | 全部付费墙先横幅后弹窗、频控、试用 30 天;首发选择"导出/反编译"这类低频高感知功能,不碰日常编辑 |
| 老用户反弹 | grandfather 规则(见 2.3),发版说明中显著公告 |
| 开源被白嫖编译 | 接受(见 4.5),正版锚定更新与支持;必要时再闭源 Pro 包 |
| Paddle 个人开户被拒/周期长 | 备选 Lemon Squeezy(license API 更全)+ 国内爱发电先行 |
| 支付/激活客服成本 | 密钥离线验签无服务器,故障面小;FAQ 文档(docs/faq/)预置激活失败排查 |
| 与上游同步冲突 | gate 集中在新增文件,宿主注入点控制在个位数(见 4.2) |
