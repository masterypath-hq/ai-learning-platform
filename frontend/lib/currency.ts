export type Currency = "usd" | "ngn";

/** Nigerian IANA timezone names as reported by `Intl` — used as a free, client-side location heuristic. */
const NIGERIA_TIMEZONES = new Set(["Africa/Lagos"]);

export function detectCurrencyFromTimezone(): Currency {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return NIGERIA_TIMEZONES.has(timeZone) ? "ngn" : "usd";
  } catch {
    return "usd";
  }
}

export function currencyToProvider(currency: Currency): "stripe" | "paystack" {
  return currency === "ngn" ? "paystack" : "stripe";
}
