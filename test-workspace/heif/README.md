# HEIF / HEIC (.heif .heic)

扩展注册了对 `.heif` / `.heic` 的支持(webview 内经 heic2any 解码),但 HEIF 是相机/手机实拍容器格式,
包含 HEVC 编码媒体与复杂的元数据盒(box)结构,无法用脚本可靠地手工生成有效样本。

获取真实测试样本的建议:

- Windows 11 自带"照片"应用导出的 HEIC 图片
- iPhone 拍摄的 `IMG_xxxx.HEIC` 原图
- 公开样本库: https://github.com/nokiatech/heif (Nokia 提供 Content/Still Image 样例)
- ffmpeg 转换: `ffmpeg -i input.png -c:v libx265 -tag:v hvc1 output.heic`

拿到样本后放入本目录,并重命名为 `sample.heic` 即可。
