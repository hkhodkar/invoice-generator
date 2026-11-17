const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency: string): string {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    } catch {
      // unknown currency code, fall back to a plain number with the code in front
      return `${currency} ${amount.toFixed(2)}`;
    }
    moneyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/** Parses a yyyy-mm-dd string as a local date (new Date('2026-01-05') would be UTC). */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(value: string): string {
  const date = parseIsoDate(value);
  return date ? dateFormatter.format(date) : '—';
}
