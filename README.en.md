# GridOS

[한국어](README.md) · [English](README.en.md) · [日本語](README.ja.md) ·
[简体中文](README.zh-CN.md)

![GridOS — Public Infrastructure Atlas](public/og.png)

**An evidence-linked map of energy, industrial, and digital infrastructure**

GridOS is a public-interest project for exploring power plants, transmission
networks, energy pipelines, data centers, and network hubs across South Korea,
Japan, Taiwan, China, and the United States in one interface.

[Open the atlas](https://oswarld.github.io/gridos/en/) ·
[한국어 UI](https://oswarld.github.io/gridos/) ·
[日本語 UI](https://oswarld.github.io/gridos/ja/) ·
[简体中文 UI](https://oswarld.github.io/gridos/zh-CN/) ·
[Report an issue](https://github.com/oswarld/gridos/issues)

> Current public release: `v1.0.0`
>
> Entry in the 14th Ministry of Trade, Industry and Energy Public Data
> Utilization Idea Competition

## What you can do

- Start with the interface language and country detail map matched to your
  region on the first visit.
- Combine layers for power plants, transmission networks, energy pipelines,
  data centers, and network hubs across five countries.
- Filter country detail maps by generation capacity, fuel, planned status, IX
  connectivity, and network count.
- Inspect source-published operators, owners, facility relationships, and the
  supporting records.
- Compare observed regional electricity demand with renewable generation.
- Follow public identity links from facility operators to listed companies,
  exchanges, and ticker symbols.
- Use the interface in Korean, English, Japanese, or Simplified Chinese.

Automatic selection always yields to a saved manual choice. GridOS does not use
an IP-geolocation service or trigger a new location permission prompt. Device
coordinates are used only when location access has already been granted;
otherwise the browser time zone and language are used. Visitors outside the
supported detection range start with the five-country overview.

Policy-brief generation and investment recommendations are outside the product
scope. Company and ticker data represent public identity relationships, not
investment advice.

## Current data coverage

The `v1.0.0` build snapshot contains about 55,000 detailed point records and
36,000 linear features, including transmission and pipeline geometries, across
five countries. Source records are linked to representative facilities,
regional balances, and operator, owner, and listed-company relationships.

This atlas is not a complete national facility registry. Dates, disclosure
scope, location precision, and aggregation methods differ by source. In
particular, the “indicative supply ratio” compares observed demand and renewable
generation with different underlying populations; it is not a measure of
electricity self-sufficiency or available grid capacity. Review the source and
methodology shown in the interface before using a value in further analysis.

## Data principles

GridOS only publishes information that a public source has directly disclosed.

- Do not infer or reconstruct undisclosed transmission, pipeline, or substation
  locations.
- Do not convert generalized locations into invented precise coordinates.
- Distinguish proximity from a physical connection confirmed by a source.
- Link records, where available, to the original URL, as-of date, retrieval
  time, and disclosure level.
- Keep OpenStreetMap source data separate from other sources and normalize only
  the attributes required for public distribution.

Key sources include:

- Public tags and geometries from
  [OpenStreetMap](https://www.openstreetmap.org/copyright)
- [U.S. EIA Form 860](https://www.eia.gov/electricity/data/eia860/)
- [HIFLD public infrastructure data](https://hifld-geoplatform.hub.arcgis.com/)
- [PeeringDB public API](https://www.peeringdb.com/apidocs/)
- [China National Energy Administration electricity market report](https://www.nea.gov.cn/20250717/54ae0fdb11f04b39a5b670999c04ef81/2025071754ae0fdb11f04b39a5b670999c04ef81_19fe782a11f3aa40209907a80e3e692150.pdf)
- Public records from national electricity agencies, operators, regulatory
  filings, and exchanges

## Run locally in under five minutes

### Prerequisites

- Node.js 20 or later
- pnpm 10 or later

```bash
git clone https://github.com/oswarld/gridos.git
cd gridos
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The repository includes a
validated snapshot, so no API key is required for the first local run.

### Rebuild data and the static site

```bash
pnpm data:build:atlas
pnpm data:build:detail
pnpm data:validate
pnpm build
```

Building the detail data downloads public upstream records and may take time.
Upstream caches are not committed. The static export supports a GitHub Pages
project base path.

## Repository layout

```text
app/                 Next.js pages and locale entry points
components/atlas/    Map, filters, sources, and relationship UI
data/processed/      Validated public atlas snapshot
public/data/detail/  Country-level detail map data
lib/                 Types, translations, and domain logic
scripts/             Collection, transformation, validation, and export
supabase/            Public-read data schema and migrations
```

The main stack is Next.js 15, React 19, TypeScript, MapLibre GL, Supabase, and
Tailwind CSS.

## Contributing and security

Code and data contributions are welcome.

1. Verify redistribution terms and permitted location precision for a new
   source.
2. Record the original URL, as-of date, retrieval time, and disclosure level.
3. Run `pnpm data:validate` and `pnpm build`.
4. Report corrections and duplicate records through
   [Issues](https://github.com/oswarld/gridos/issues).

Do not commit secrets, administrative keys, or upstream API credentials. Report
vulnerabilities and exposed credentials through the private channel described
in the [security policy](SECURITY.md), not a public issue.

## License and attribution

Each dataset remains subject to its source license and terms of use.
OpenStreetMap data requires ODbL attribution. Until a separate software license
is added, publication of the source code does not grant permission to reuse it.
