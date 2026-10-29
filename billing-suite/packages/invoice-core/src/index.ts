/** Invoice numbering helpers. GST rules limit invoice numbers to 16 characters. */

/** Indian financial year (Apr-Mar) in compact form, e.g. 2025-04-10 -> "2526". */
export function financialYear(date: Date, startMonth = 4): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const start = m >= startMonth ? y : y - 1;
  const a = String(start % 100).padStart(2, "0");
  const b = String((start + 1) % 100).padStart(2, "0");
  return `${a}${b}`;
}

export function formatInvoiceNumber(prefix: string, fy: string, seq: number, pad = 5): string {
  if (!Number.isInteger(seq) || seq < 1) throw new Error("Sequence must be a positive integer");
  const num = `${prefix}/${fy}/${String(seq).padStart(pad, "0")}`;
  if (num.length > 16) throw new Error(`Invoice number "${num}" exceeds 16 characters`);
  return num;
}
