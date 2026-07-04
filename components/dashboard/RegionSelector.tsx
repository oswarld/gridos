"use client";

import type { GridData } from "@/lib/types";

export default function RegionSelector({
  data,
  selected,
  onChange,
}: {
  data: GridData;
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  const toggle = (code: string) => {
    onChange(
      selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]
    );
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-stone2">Step 1</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[28px] font-medium leading-[1.25] text-ink">지역 선택</h2>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-slate2">
            비교할 광역지자체를 고르세요. 점수 정규화는 항상 전국 17개 시도 기준으로 유지됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onChange(data.regions.map((r) => r.regionCode))}
            className="rounded-full border border-hairline-strong px-4 py-1.5 text-[13px] font-medium text-ink transition hover:bg-surface"
          >
            전체 선택
          </button>
          <button
            onClick={() => onChange([])}
            className="rounded-full border border-hairline-strong px-4 py-1.5 text-[13px] font-medium text-ink transition hover:bg-surface"
          >
            전체 해제
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {data.regions.map((r) => {
          const active = selected.includes(r.regionCode);
          return (
            <button
              key={r.regionCode}
              onClick={() => toggle(r.regionCode)}
              aria-pressed={active}
              className={`rounded-full px-4 py-2 text-[14px] font-medium transition ${
                active
                  ? "bg-ink text-white"
                  : "border border-hairline bg-canvas text-steel hover:border-hairline-strong hover:text-ink"
              }`}
            >
              {r.regionName}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] text-stone2">{selected.length}개 시도 선택됨</p>
    </div>
  );
}
