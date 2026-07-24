import {
  COUNTRY_CODES,
  type CountryCode,
} from "./atlas-types";
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "./i18n";

export type CountrySelection = CountryCode | "ALL";

export type VisitorSelection = {
  locale: Locale;
  country: CountrySelection;
  countrySource: "saved" | "coordinates" | "timezone" | "language" | "default";
};

const LOCALE_STORAGE_KEY = "gridos.locale";
const COUNTRY_STORAGE_KEY = "gridos.country";

const COUNTRY_LOCALES: Record<CountryCode, Locale> = {
  KR: "ko",
  JP: "ja",
  TW: "zh-CN",
  CN: "zh-CN",
  US: "en",
};

const TIMEZONE_COUNTRIES: Record<string, CountryCode> = {
  "Asia/Seoul": "KR",
  "Asia/Tokyo": "JP",
  "Asia/Taipei": "TW",
  "Asia/Shanghai": "CN",
  "Asia/Chongqing": "CN",
  "Asia/Harbin": "CN",
  "Asia/Urumqi": "CN",
  "America/New_York": "US",
  "America/Detroit": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Indiana/Knox": "US",
  "America/Indiana/Marengo": "US",
  "America/Indiana/Petersburg": "US",
  "America/Indiana/Tell_City": "US",
  "America/Indiana/Vevay": "US",
  "America/Indiana/Vincennes": "US",
  "America/Indiana/Winamac": "US",
  "America/Kentucky/Louisville": "US",
  "America/Kentucky/Monticello": "US",
  "America/Chicago": "US",
  "America/Menominee": "US",
  "America/North_Dakota/Beulah": "US",
  "America/North_Dakota/Center": "US",
  "America/North_Dakota/New_Salem": "US",
  "America/Denver": "US",
  "America/Boise": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "America/Juneau": "US",
  "America/Metlakatla": "US",
  "America/Nome": "US",
  "America/Sitka": "US",
  "America/Yakutat": "US",
  "America/Adak": "US",
  "Pacific/Honolulu": "US",
};

type CoordinateBounds = {
  country: CountryCode;
  west: number;
  south: number;
  east: number;
  north: number;
};

const COUNTRY_BOUNDS: CoordinateBounds[] = [
  { country: "KR", west: 124.5, south: 33, east: 132, north: 39.3 },
  { country: "JP", west: 122.5, south: 24, east: 146, north: 46 },
  { country: "TW", west: 119, south: 21.5, east: 123, north: 25.8 },
  { country: "CN", west: 73, south: 18, east: 135, north: 54 },
  { country: "US", west: -126, south: 24, east: -65, north: 50 },
  { country: "US", west: -170, south: 51, east: -129, north: 72 },
  { country: "US", west: -161, south: 18, east: -154, north: 23 },
];

function normalizeLanguageTag(language: string): string {
  return language.trim().replaceAll("_", "-").toLowerCase();
}

function localeFromLanguages(languages: readonly string[]): Locale {
  for (const language of languages.map(normalizeLanguageTag)) {
    if (language === "ko" || language.startsWith("ko-")) return "ko";
    if (language === "ja" || language.startsWith("ja-")) return "ja";
    if (language === "zh" || language.startsWith("zh-")) return "zh-CN";
    if (language === "en" || language.startsWith("en-")) return "en";
  }
  return "en";
}

function countryFromLanguages(
  languages: readonly string[],
): CountryCode | undefined {
  for (const language of languages.map(normalizeLanguageTag)) {
    if (language === "ko" || language.startsWith("ko-")) return "KR";
    if (language === "ja" || language.startsWith("ja-")) return "JP";
    if (
      language === "zh-tw" ||
      language === "zh-hant" ||
      language.startsWith("zh-hant-")
    ) {
      return "TW";
    }
    if (
      language === "zh" ||
      language === "zh-cn" ||
      language === "zh-hans" ||
      language.startsWith("zh-hans-")
    ) {
      return "CN";
    }
    if (language === "en-us") return "US";
  }
  return undefined;
}

export function localeForCountry(country: CountryCode): Locale {
  return COUNTRY_LOCALES[country];
}

export function countryFromTimeZone(
  timeZone: string | undefined,
): CountryCode | undefined {
  if (!timeZone) return undefined;
  return TIMEZONE_COUNTRIES[timeZone];
}

export function countryFromCoordinates(
  longitude: number,
  latitude: number,
): CountryCode | undefined {
  return COUNTRY_BOUNDS.find(
    ({ west, south, east, north }) =>
      longitude >= west &&
      longitude <= east &&
      latitude >= south &&
      latitude <= north,
  )?.country;
}

export function resolveVisitorSelection({
  explicitLocale,
  savedLocale,
  savedCountry,
  coordinateCountry,
  timeZone,
  languages,
}: {
  explicitLocale?: Locale;
  savedLocale?: Locale;
  savedCountry?: CountrySelection;
  coordinateCountry?: CountryCode;
  timeZone?: string;
  languages: readonly string[];
}): VisitorSelection {
  const timezoneCountry = countryFromTimeZone(timeZone);
  const languageCountry = countryFromLanguages(languages);
  const country =
    savedCountry ??
    coordinateCountry ??
    timezoneCountry ??
    languageCountry ??
    "ALL";
  const countrySource: VisitorSelection["countrySource"] =
    savedCountry !== undefined
      ? "saved"
      : coordinateCountry
        ? "coordinates"
        : timezoneCountry
          ? "timezone"
          : languageCountry
            ? "language"
            : "default";
  const locale =
    explicitLocale ??
    savedLocale ??
    (country === "ALL"
      ? localeFromLanguages(languages)
      : localeForCountry(country));

  return { locale, country, countrySource };
}

export function readSavedLocale(): Locale | undefined {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return value && isLocale(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function readSavedCountry(): CountrySelection | undefined {
  try {
    const value = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (value === "ALL") return value;
    return value &&
      COUNTRY_CODES.includes(value as CountryCode)
      ? (value as CountryCode)
      : undefined;
  } catch {
    return undefined;
  }
}

export function saveVisitorLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

export function saveVisitorCountry(country: CountrySelection): void {
  try {
    window.localStorage.setItem(COUNTRY_STORAGE_KEY, country);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

export async function detectGrantedLocationCountry(): Promise<
  CountryCode | undefined
> {
  if (!navigator.geolocation || !navigator.permissions) return undefined;

  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });
    if (permission.state !== "granted") return undefined;

    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve(
            countryFromCoordinates(coords.longitude, coords.latitude),
          ),
        () => resolve(undefined),
        {
          enableHighAccuracy: false,
          maximumAge: 60 * 60 * 1000,
          timeout: 2000,
        },
      );
    });
  } catch {
    return undefined;
  }
}

export const VISITOR_DEFAULT_SELECTION: VisitorSelection = {
  locale: DEFAULT_LOCALE,
  country: "ALL",
  countrySource: "default",
};
