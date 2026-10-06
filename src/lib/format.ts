import { format, parseISO, isValid } from "date-fns";

/**
 * Standard monetary formatter for TrustTracker
 * Uses Intl.NumberFormat with tabular numerical output.
 */
export function formatMoney(
  amount: number | string | undefined | null,
  currency: string = "INR",
  options?: {
    showSign?: boolean;
    compact?: boolean;
    showCents?: boolean;
  }
): string {
  const num =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
      ? parseFloat(amount)
      : 0;
  const safeNum = isNaN(num) ? 0 : num;
  const code = (currency || "INR").toUpperCase();

  const locale =
    code === "INR"
      ? "en-IN"
      : code === "USD"
      ? "en-US"
      : code === "EUR"
      ? "de-DE"
      : code === "GBP"
      ? "en-GB"
      : undefined;

  const hasDecimals = safeNum % 1 !== 0;
  const minDecimals =
    options?.showCents !== undefined
      ? options.showCents
        ? 2
        : 0
      : hasDecimals
      ? 2
      : 0;
  const maxDecimals = options?.showCents === false ? 0 : 2;

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      notation: options?.compact ? "compact" : "standard",
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(Math.abs(safeNum));

    if (options?.showSign && safeNum !== 0) {
      return safeNum > 0 ? `+${formatted}` : `-${formatted}`;
    }

    return safeNum < 0 && !options?.showSign ? `-${formatted}` : formatted;
  } catch {
    const sym = code === "INR" ? "₹" : code === "USD" ? "$" : code;
    const basic = `${sym}${Math.abs(safeNum).toLocaleString(undefined, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    })}`;
    if (options?.showSign && safeNum !== 0) {
      return safeNum > 0 ? `+${basic}` : `-${basic}`;
    }
    return safeNum < 0 ? `-${basic}` : basic;
  }
}

/**
 * Parse any date input (ISO string, timestamp, Date object) safely
 */
function parseDateInput(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isValid(dateInput) ? dateInput : null;
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isValid(d) ? d : null;
  }
  try {
    const parsed = parseISO(dateInput);
    if (isValid(parsed)) return parsed;
    const fallback = new Date(dateInput);
    return isValid(fallback) ? fallback : null;
  } catch {
    return null;
  }
}

/**
 * Standard date formatter: e.g. "6 Oct 2026"
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  fallback: string = "—"
): string {
  const d = parseDateInput(dateInput);
  if (!d) return fallback;
  try {
    return format(d, "d MMM yyyy");
  } catch {
    return fallback;
  }
}

/**
 * Standard date & time formatter: e.g. "6 Oct 2026, 1:01 pm"
 */
export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  fallback: string = "—"
): string {
  const d = parseDateInput(dateInput);
  if (!d) return fallback;
  try {
    return format(d, "d MMM yyyy, h:mm a");
  } catch {
    return fallback;
  }
}

/**
 * Standard time formatter: e.g. "1:01 pm"
 */
export function formatTime(
  dateInput: string | number | Date | null | undefined,
  fallback: string = "—"
): string {
  const d = parseDateInput(dateInput);
  if (!d) return fallback;
  try {
    return format(d, "h:mm a");
  } catch {
    return fallback;
  }
}

/**
 * Category label formatter.
 * Standardizes "Unknown", "Unknown Category", null or empty into "Uncategorized".
 */
export function formatCategory(categoryName?: string | null): string {
  if (!categoryName) return "Uncategorized";
  const trimmed = categoryName.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === "unknown" ||
    lower === "unknown category" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === ""
  ) {
    return "Uncategorized";
  }
  return trimmed;
}
