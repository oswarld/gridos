"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  detectGrantedLocationCountry,
  readSavedCountry,
  readSavedLocale,
  resolveVisitorSelection,
  saveVisitorLocale,
  VISITOR_DEFAULT_SELECTION,
  type VisitorSelection,
} from "@/lib/visitor-region";
import AtlasDashboard from "./AtlasDashboard";

export default function VisitorAtlasDashboard({
  locale: explicitLocale,
}: {
  locale?: Locale;
}) {
  const [selection, setSelection] = useState<VisitorSelection>(() => ({
    ...VISITOR_DEFAULT_SELECTION,
    locale: explicitLocale ?? VISITOR_DEFAULT_SELECTION.locale,
  }));

  useEffect(() => {
    if (explicitLocale) saveVisitorLocale(explicitLocale);

    const languages =
      navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const initialSelection = resolveVisitorSelection({
      explicitLocale,
      savedLocale: readSavedLocale(),
      savedCountry: readSavedCountry(),
      timeZone,
      languages,
    });
    setSelection(initialSelection);

    let cancelled = false;
    void detectGrantedLocationCountry().then((coordinateCountry) => {
      if (
        cancelled ||
        !coordinateCountry ||
        readSavedCountry() !== undefined
      ) {
        return;
      }
      setSelection(
        resolveVisitorSelection({
          explicitLocale,
          savedLocale: readSavedLocale(),
          coordinateCountry,
          timeZone,
          languages,
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [explicitLocale]);

  return (
    <AtlasDashboard
      key={`${selection.locale}:${selection.country}`}
      locale={selection.locale}
      initialCountry={selection.country}
    />
  );
}
