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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">① 지역 선택</h2>
          <p className="mt-1 text-sm text-slate-500">
            비교할 광역지자체를 선택하세요. 점수 정규화는 전국 17개 시도 기준으로 유지됩니다.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => onChange(data.regions.map((r) => r.regionCode))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            전체 선택
          </button>
          <button
            onClick={() => onChange([])}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            전체 해제
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.regions.map((r) => {
          const active = selected.includes(r.regionCode);
          return (
            <button
              key={r.regionCode}
              onClick={() => toggle(r.regionCode)}
              aria-pressed={active}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r.regionName}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">선택됨: {selected.length} / 17개 시도</p>
    </div>
  );
}
