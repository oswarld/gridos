"use client";

import type { GridData, SourceAccessMethod } from "@/lib/types";
import { humanizeTitle } from "@/lib/format";

const ACCESS_LABELS: Record<SourceAccessMethod, { label: string; cls: string }> = {
  data_go_kr_file: { label: "파일 스냅샷", cls: "bg-surface-yellow text-yellow-dark" },
  data_go_kr_openapi: { label: "OpenAPI 연동", cls: "bg-teal-light text-moss" },
  institution_openapi: { label: "기관 OpenAPI", cls: "bg-teal-light text-moss" },
  manual_web_download: { label: "웹 조회 스냅샷", cls: "bg-coral-light text-coral-dark" },
};

export default function DataStatusPanel({ data }: { data: GridData }) {
  const exportCsv = () => {
    const header = "제공기관,데이터명,링크,기준일,행수,수집일,접근방식";
    const rows = data.sources.map((s) =>
      [s.provider, s.title, s.url, s.baseDate ?? "", s.rowCount, s.collectedAt.slice(0, 10), ACCESS_LABELS[s.accessMethod].label]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "k-grid-데이터출처표.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-stone2">Step 2</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[28px] font-medium leading-[1.25] text-ink">실제 데이터 현황</h2>
          <p className="mt-1.5 max-w-xl text-[15px] leading-[1.5] text-slate2">
            모든 점수와 판정은 아래 원천에서만 계산됩니다. 행 수가 0인 원천이 있으면 빌드
            단계에서 배포가 차단됩니다.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-charcoal"
        >
          데이터 출처표 내려받기
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-hairline bg-surface text-[11px] font-semibold uppercase tracking-[0.5px] text-steel">
              <th className="px-4 py-3">제공기관</th>
              <th className="px-4 py-3">데이터</th>
              <th className="px-4 py-3">기준일</th>
              <th className="px-4 py-3 text-right">행 수</th>
              <th className="px-4 py-3">수집일</th>
              <th className="px-4 py-3">접근 방식</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.map((s) => {
              const access = ACCESS_LABELS[s.accessMethod];
              return (
                <tr key={s.id} className="border-b border-hairline-soft last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-slate2">{s.provider}</td>
                  <td className="px-4 py-3">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition hover:decoration-ink"
                    >
                      {humanizeTitle(s.title)}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate2">
                    {s.baseDate ?? "미상"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">
                    {s.rowCount.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate2">
                    {s.collectedAt.slice(0, 10)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${access.cls}`}>
                      {access.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
