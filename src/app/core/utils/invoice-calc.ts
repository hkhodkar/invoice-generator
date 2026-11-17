import { DiscountType, Invoice, InvoiceTotals, LineItem } from '../models/invoice.model';
import { parseIsoDate } from './format';

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safe(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function lineTotal(item: Pick<LineItem, 'quantity' | 'unitPrice'>): number {
  return roundMoney(safe(item.quantity) * safe(item.unitPrice));
}

export function calculateTotals(
  items: readonly Pick<LineItem, 'quantity' | 'unitPrice'>[],
  taxRate: number,
  discountType: DiscountType,
  discount: number,
): InvoiceTotals {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));

  const rawDiscount =
    discountType === 'percent' ? (subtotal * clamp(safe(discount), 0, 100)) / 100 : safe(discount);
  // a discount can never push the invoice below zero
  const discountAmount = roundMoney(clamp(rawDiscount, 0, subtotal));

  const taxable = subtotal - discountAmount;
  const tax = roundMoney((taxable * Math.max(safe(taxRate), 0)) / 100);

  return {
    subtotal,
    discount: discountAmount,
    tax,
    total: roundMoney(taxable + tax),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** A sent invoice is overdue once its due date has passed. Drafts and paid invoices never are. */
export function isOverdue(invoice: Pick<Invoice, 'status' | 'dueDate'>, today = new Date()): boolean {
  if (invoice.status !== 'sent') return false;
  const due = parseIsoDate(invoice.dueDate);
  if (!due) return false;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return due < startOfToday;
}
