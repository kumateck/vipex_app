/** Amounts on the bill: always two decimals. */
export function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Per-message prices are fractions of a cent, so show up to four decimals. */
export function formatRate(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}
