"use client";

import type { GridData, SourceAccessMethod } from "@/lib/types";

const ACCESS_LABELS: Record<SourceAccessMethod, { label: string; cls: string }> = {
  data_go_kr_file: { label: "파일 스냅샷", cls: "bg-sky-100 text-sky-800" },
  data_go_kr_openapi: { label: "OpenAPI", cls: "bg-emerald-100 text-emerald-800" },
  institution_openapi: { label: "기관 OpenAPI", cls: "bg-emerald-100 text-emerald-800" },
  manual_web_download: { label: "웹 조회 수동 스냅샷", cls: "bg-amber-100 text-amber-800" },
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
    a.download = "gridos-데이터출처표.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">② 실제 데이터 현황</h2>
          <p className="mt-1 text-sm text-slate-500">
            모든 점수와 차트는 아래 원천에서만 계산됩니다. 행 수가 0인 원천이 있으면 빌드가
            차단됩니다.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          데이터 출처표 다운로드 (CSV)
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">제공기관</th>
              <th className="py-2 pr-3">데이터</th>
              <th className="py-2 pr-3">기준일</th>
              <th className="py-2 pr-3 text-right">행 수</th>
              <th className="py-2 pr-3">수집일</th>
              <th className="py-2">접근 방식</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.map((s) => {
              const access = ACCESS_LABELS[s.accessMethod];
              return (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600">{s.provider}</td>
                  <td className="py-2.5 pr-3">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                    >
                      {s.title}
                    </a>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-slate-600">
                    {s.baseDate ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-900">
                    {s.rowCount.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-slate-600">
                    {s.collectedAt.slice(0, 10)}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${access.cls}`}>
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
