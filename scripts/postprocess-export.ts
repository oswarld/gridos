/**
 * Next.js owns the single root <html> element, so a fully static App Router export
 * initially inherits the root Korean lang attribute. Fix each locale artifact after
 * export and add alternate-language links without introducing runtime JavaScript.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "out");
const locales = ["ko", "en", "zh-CN", "ja"] as const;
const basePath = (process.env.PAGES_BASE_PATH || "").replace(/\/$/, "");

const alternates = [
  ...locales.map(
    (locale) =>
      `<link rel="alternate" hreflang="${locale}" href="${basePath}/${locale}/"/>`,
  ),
  `<link rel="alternate" hreflang="x-default" href="${basePath}/"/>`,
].join("");

for (const locale of locales) {
  const htmlPath = path.join(OUT, locale, "index.html");
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`missing static locale artifact: ${htmlPath}`);
  }
  const original = fs.readFileSync(htmlPath, "utf8");
  const withLanguage = original.replace(/<html lang="[^"]*">/, `<html lang="${locale}">`);
  if (withLanguage === original && !original.includes(`<html lang="${locale}">`)) {
    throw new Error(`unable to set html lang for ${locale}`);
  }
  const processed = withLanguage.includes('rel="alternate"')
    ? withLanguage
    : withLanguage.replace("</head>", `${alternates}</head>`);
  fs.writeFileSync(htmlPath, processed, "utf8");
}

const rootHtmlPath = path.join(OUT, "index.html");
if (fs.existsSync(rootHtmlPath)) {
  const rootHtml = fs.readFileSync(rootHtmlPath, "utf8");
  if (!rootHtml.includes('rel="alternate"')) {
    fs.writeFileSync(
      rootHtmlPath,
      rootHtml.replace("</head>", `${alternates}</head>`),
      "utf8",
    );
  }
}

console.log(`[export] localized html lang and hreflang for ${locales.join(", ")}`);
