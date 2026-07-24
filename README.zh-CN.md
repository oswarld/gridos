# GridOS

[한국어](README.md) · [English](README.en.md) · [日本語](README.ja.md) ·
[简体中文](README.zh-CN.md)

![GridOS — Public Infrastructure Atlas](public/og.png)

**用公开证据连接能源、产业与数字基础设施**

GridOS 是一个公益公开项目，可在同一界面中探索韩国、日本、台湾、中国和美国的
发电设施、输电网络、能源管道、数据中心与网络枢纽。

[打开地图](https://oswarld.github.io/gridos/zh-CN/) ·
[한국어 UI](https://oswarld.github.io/gridos/) ·
[English UI](https://oswarld.github.io/gridos/en/) ·
[日本語 UI](https://oswarld.github.io/gridos/ja/) ·
[反馈问题](https://github.com/oswarld/gridos/issues)

> 当前公开版本：`v1.0.0`
>
> 第14届产业通商部公共数据应用创意竞赛参赛作品

## 可以用 GridOS 做什么

- 首次访问时，根据所在地区自动选择界面语言和对应国家的详细地图
- 组合查看五个国家的发电设施、输电网络、能源管道、数据中心和网络枢纽图层
- 按发电容量、燃料、规划状态、IX 连接和网络数量筛选各国详细地图
- 查看公开资料所载的运营方、所有者、设施关系及其原始依据
- 比较各地区观测到的用电需求与可再生能源发电量
- 查看设施运营方与上市公司、交易所和股票代码之间的公开身份关系
- 使用韩语、英语、日语或简体中文界面

自动选择始终让位于已保存的手动选择。GridOS 不使用 IP 定位服务，也不会主动
弹出新的位置权限请求。仅当浏览器已获位置权限时才会使用设备位置；否则使用
浏览器时区和语言。无法判断为支持地区时，将从五国总览地图开始。

政策简报生成和投资建议不在本产品范围内。企业与股票代码信息仅表示公开身份
关系，不构成投资建议。

## 当前数据范围

`v1.0.0` 构建快照包含五个国家约5.5万条详细点记录，以及约3.6万条输电线路、
管道等线状要素。代表性设施、地区供需、运营方、所有者与上市公司关系均尽可能
关联原始资料。

本地图不是完整的国家设施名录。各信息源的基准日期、公开范围、位置精度和汇总
方式并不一致。尤其是“参考供给比例”比较了统计口径不同的观测需求和可再生能源
发电量，不代表电力自给率或电网可用容量。在进一步分析前，请先查看界面中显示的
原始资料与方法说明。

## 数据原则

GridOS 仅发布公开信息源直接披露的内容。

- 不推断或还原未公开的输电线路、管道或变电站位置
- 不把概化位置转换为虚构的精确坐标
- 区分空间邻近关系与信息源确认的物理连接
- 在可获取的情况下，为记录关联原始 URL、基准日期、采集时间与公开级别
- 将 OpenStreetMap 原始数据与其他来源分开，仅规范化公开发布所需的属性

主要信息源包括：

- [OpenStreetMap](https://www.openstreetmap.org/copyright) 的公开标签与几何数据
- [U.S. EIA Form 860](https://www.eia.gov/electricity/data/eia860/)
- [HIFLD 公共基础设施数据](https://hifld-geoplatform.hub.arcgis.com/)
- [PeeringDB 公共 API](https://www.peeringdb.com/apidocs/)
- [中国国家能源局电力市场报告](https://www.nea.gov.cn/20250717/54ae0fdb11f04b39a5b670999c04ef81/2025071754ae0fdb11f04b39a5b670999c04ef81_19fe782a11f3aa40209907a80e3e692150.pdf)
- 各国电力机构、运营商、监管披露与交易所的公开资料

## 五分钟内在本地运行

### 环境要求

- Node.js 20 或更高版本
- pnpm 10 或更高版本

```bash
git clone https://github.com/oswarld/gridos.git
cd gridos
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。仓库已包含经过验证的
数据快照，因此首次本地运行不需要 API 密钥。

### 重新构建数据与静态站点

```bash
pnpm data:build:atlas
pnpm data:build:detail
pnpm data:validate
pnpm build
```

构建详细数据时需要下载公开上游资料，可能耗时较长。上游缓存不提交到仓库。
静态导出支持 GitHub Pages 项目路径。

## 仓库结构

```text
app/                 Next.js 页面与语言入口
components/atlas/    地图、筛选、来源与关系界面
data/processed/      经过验证的公开地图快照
public/data/detail/  各国详细地图数据
lib/                 类型、翻译与领域逻辑
scripts/             采集、转换、验证与静态导出
supabase/            公共只读数据结构与迁移
```

主要技术栈为 Next.js 15、React 19、TypeScript、MapLibre GL、Supabase 和
Tailwind CSS。

## 贡献与安全

欢迎代码与数据贡献。

1. 先确认新信息源的再分发条件和允许公开的位置精度。
2. 记录原始 URL、基准日期、采集时间与公开级别。
3. 运行 `pnpm data:validate` 和 `pnpm build`。
4. 数据错误、重复或更正请通过
   [Issues](https://github.com/oswarld/gridos/issues) 反馈。

请勿提交密钥、管理员密钥或上游 API 凭证。漏洞和凭证泄露请通过
[安全政策](SECURITY.md) 中的私密渠道报告，不要创建公开 Issue。

## 许可与署名

每个数据集均受其来源许可和使用条款约束。OpenStreetMap 数据需要遵守 ODbL
署名要求。在另行添加软件许可证之前，源代码公开并不代表授予复用许可。
