export function formatPrice(value: number | null, currency: string | null): string {
  if (value == null) return "N/A";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRatio(value: number | null, digits = 1): string {
  if (value == null) return "N/A";
  return value.toFixed(digits);
}

export function formatMarketCap(value: number | null, currency: string | null): string {
  if (value == null) return "N/A";
  if (currency === "KRW") {
    const jo = value / 1_0000_0000_0000; // 1조 = 1e12
    return `${jo.toLocaleString(undefined, { maximumFractionDigits: 1 })}조원`;
  }
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString();
}
