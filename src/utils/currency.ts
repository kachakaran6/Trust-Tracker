/**
 * Universal Currency & Locale Management Utility for TrustTracker
 * Supports auto-detection, international currencies, and clean localized formatting.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  flag?: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "AU$", locale: "en-AU" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", locale: "ar-AE" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", locale: "ar-SA" },
  { code: "SGD", name: "Singapore Dollar", symbol: "SG$", locale: "en-SG" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", locale: "en-NZ" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", locale: "zh-HK" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", locale: "ko-KR" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", locale: "pt-BR" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", locale: "es-MX" },
  { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", locale: "da-DK" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", locale: "pl-PL" },
  { code: "THB", name: "Thai Baht", symbol: "฿", locale: "th-TH" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "ms-MY" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", locale: "id-ID" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", locale: "en-PH" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", locale: "tr-TR" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", locale: "ru-RU" },
];

export const CURRENCY_MAP = new Map<string, CurrencyInfo>(
  CURRENCIES.map((c) => [c.code.toUpperCase(), c])
);

/**
 * Autodetect the user's currency based on their system timezone and browser locale.
 */
export function detectUserCurrency(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzLower = timeZone.toLowerCase();

    if (tzLower.includes("calcutta") || tzLower.includes("kolkata") || tzLower.includes("india")) {
      return "INR";
    }
    if (tzLower.includes("london")) return "GBP";
    if (tzLower.includes("paris") || tzLower.includes("berlin") || tzLower.includes("rome") || tzLower.includes("madrid") || tzLower.includes("amsterdam")) {
      return "EUR";
    }
    if (tzLower.includes("tokyo")) return "JPY";
    if (tzLower.includes("dubai")) return "AED";
    if (tzLower.includes("riyadh")) return "SAR";
    if (tzLower.includes("singapore")) return "SGD";
    if (tzLower.includes("sydney") || tzLower.includes("melbourne") || tzLower.includes("brisbane") || tzLower.includes("perth")) {
      return "AUD";
    }
    if (tzLower.includes("toronto") || tzLower.includes("vancouver") || tzLower.includes("montreal")) {
      return "CAD";
    }
    if (tzLower.includes("seoul")) return "KRW";
    if (tzLower.includes("shanghai") || tzLower.includes("beijing")) return "CNY";
    if (tzLower.includes("sao_paulo")) return "BRL";
    if (tzLower.includes("mexico")) return "MXN";
    if (tzLower.includes("johannesburg")) return "ZAR";
    if (tzLower.includes("zurich")) return "CHF";

    const navLangs = navigator.languages || [navigator.language || ""];
    for (const lang of navLangs) {
      const code = lang.toUpperCase();
      if (code.includes("-IN") || code.startsWith("HI") || code.startsWith("TA") || code.startsWith("TE") || code.startsWith("MR")) {
        return "INR";
      }
      if (code.includes("-GB")) return "GBP";
      if (code.includes("-CA")) return "CAD";
      if (code.includes("-AU")) return "AUD";
      if (code.includes("-JP") || code.startsWith("JA")) return "JPY";
      if (code.includes("-DE") || code.includes("-FR") || code.includes("-IT") || code.includes("-ES")) return "EUR";
      if (code.includes("-AE") || code.includes("-SA")) return "AED";
      if (code.includes("-SG")) return "SGD";
      if (code.includes("-CN") || code.startsWith("ZH")) return "CNY";
      if (code.includes("-KR") || code.startsWith("KO")) return "KRW";
      if (code.includes("-BR")) return "BRL";
      if (code.includes("-MX")) return "MXN";
    }
  } catch (err) {
    console.warn("Error detecting currency:", err);
  }

  return "INR";
}

/**
 * Get the currency symbol for a given currency code.
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return "₹";
  const code = currencyCode.toUpperCase();
  const info = CURRENCY_MAP.get(code);
  if (info) return info.symbol;

  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === "currency")?.value;
    return sym || code;
  } catch {
    return code;
  }
}

/**
 * Robust, localized currency formatting.
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCode?: string,
  options?: {
    showCents?: boolean;
    compact?: boolean;
  }
): string {
  const num = typeof amount === "number" ? amount : typeof amount === "string" ? parseFloat(amount) : 0;
  const safeNum = isNaN(num) ? 0 : num;
  const code = (currencyCode || "INR").toUpperCase();
  const info = CURRENCY_MAP.get(code);

  const locale = info?.locale || (code === "INR" ? "en-IN" : code === "USD" ? "en-US" : undefined);

  const hasDecimals = safeNum % 1 !== 0;
  const minDecimals = options?.showCents !== undefined ? (options.showCents ? 2 : 0) : (hasDecimals ? 2 : 0);
  const maxDecimals = options?.showCents === false ? 0 : 2;

  try {
    if (options?.compact) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(safeNum);
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(safeNum);
  } catch {
    const symbol = getCurrencySymbol(code);
    return `${symbol}${safeNum.toLocaleString(undefined, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    })}`;
  }
}
