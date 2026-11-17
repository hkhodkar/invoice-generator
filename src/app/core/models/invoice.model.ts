export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export type DiscountType = 'percent' | 'amount';

export interface Party {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  issueDate: string; // yyyy-mm-dd
  dueDate: string;
  currency: string;
  from: Party;
  to: Party;
  items: LineItem[];
  taxRate: number;
  discountType: DiscountType;
  discount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Everything the user edits in the form; ids and timestamps are handled by the store. */
export type InvoiceDraft = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export const INVOICE_STATUSES: readonly InvoiceStatus[] = ['draft', 'sent', 'paid'];

export const CURRENCIES: readonly { code: string; label: string }[] = [
  { code: 'USD', label: 'USD – US Dollar' },
  { code: 'EUR', label: 'EUR – Euro' },
  { code: 'GBP', label: 'GBP – British Pound' },
  { code: 'CAD', label: 'CAD – Canadian Dollar' },
  { code: 'AUD', label: 'AUD – Australian Dollar' },
  { code: 'CHF', label: 'CHF – Swiss Franc' },
  { code: 'JPY', label: 'JPY – Japanese Yen' },
  { code: 'AED', label: 'AED – UAE Dirham' },
];

export function emptyParty(): Party {
  return { name: '', email: '', phone: '', address: '', taxId: '' };
}

export function toDraft(invoice: Invoice): InvoiceDraft {
  const { id, createdAt, updatedAt, ...draft } = invoice;
  return draft;
}
