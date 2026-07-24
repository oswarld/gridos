import type { ReactNode } from 'react';

export function InfoTip({
  content,
  label = 'Info',
}: {
  content: ReactNode;
  label?: string;
}) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        role="img"
        aria-label={label}
        tabIndex={0}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#c7cad5] bg-white text-[10px] font-semibold leading-none text-[#6b6f7e] transition hover:border-[#1c1c1e] hover:text-[#1c1c1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4262ff] focus-visible:ring-offset-2"
      >
        ⓘ
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[#e0e2e8] bg-white px-3 py-2 text-[11px] font-normal leading-5 text-[#050038] opacity-0 shadow-[0_12px_32px_-4px_rgba(5,0,56,.14)] transition group-hover:opacity-100 group-focus-within:opacity-100">
        {content}
      </span>
    </span>
  );
}

