import { Injectable, computed, signal } from '@angular/core';

import { createDemoInvoices } from '../data/demo-invoices';
import { Invoice, InvoiceDraft, InvoiceStatus, Party, emptyParty, toDraft } from '../models/invoice.model';
import { addDays, parseIsoDate, toIsoDate } from '../utils/format';

export const STORAGE_KEY = 'invoice-generator.invoices';

@Injectable({ providedIn: 'root' })
export class InvoiceStore {
  private readonly state = signal<Invoice[]>(this.load());

  /** Newest first. */
  readonly invoices = computed(() =>
    [...this.state()].sort(
      (a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number),
    ),
  );

  readonly count = computed(() => this.state().length);

  getById(id: string): Invoice | undefined {
    return this.state().find((invoice) => invoice.id === id);
  }

  create(draft: InvoiceDraft): Invoice {
    const now = new Date().toISOString();
    const invoice: Invoice = { ...structuredClone(draft), id: createId(), createdAt: now, updatedAt: now };
    this.commit([...this.state(), invoice]);
    return invoice;
  }

  update(id: string, draft: InvoiceDraft): Invoice | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updated: Invoice = {
      ...structuredClone(draft),
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.commit(this.state().map((invoice) => (invoice.id === id ? updated : invoice)));
    return updated;
  }

  setStatus(id: string, status: InvoiceStatus): void {
    const existing = this.getById(id);
    if (!existing || existing.status === status) return;
    this.update(id, { ...toDraft(existing), status });
  }

  remove(id: string): void {
    this.commit(this.state().filter((invoice) => invoice.id !== id));
  }

  /** Copies an invoice as a new draft dated today, keeping the original payment term. */
  duplicate(id: string): Invoice | undefined {
    const source = this.getById(id);
    if (!source) return undefined;

    const today = new Date();
    return this.create({
      ...toDraft(source),
      number: this.nextNumber(),
      status: 'draft',
      issueDate: toIsoDate(today),
      dueDate: toIsoDate(addDays(today, paymentTermDays(source))),
    });
  }

  /** Next number in the INV-<year>-0001 sequence, based on what's already stored. */
  nextNumber(date = new Date()): string {
    const prefix = `INV-${date.getFullYear()}-`;
    const highest = this.state()
      .filter((invoice) => invoice.number.startsWith(prefix))
      .map((invoice) => Number.parseInt(invoice.number.slice(prefix.length), 10))
      .filter((n) => Number.isFinite(n))
      .reduce((max, n) => Math.max(max, n), 0);
    return prefix + String(highest + 1).padStart(4, '0');
  }

  /** Business details from the most recently edited invoice, used to prefill new ones. */
  lastSender(): Party {
    const latest = [...this.state()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return latest ? { ...latest.from } : emptyParty();
  }

  resetDemoData(): void {
    this.commit(createDemoInvoices());
  }

  private commit(invoices: Invoice[]): void {
    this.state.set(invoices);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch {
      // storage can be full or disabled (private mode) – keep working in memory
    }
  }

  private load(): Invoice[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Invoice[];
      }
    } catch {
      // corrupted data, fall through to the demo set
    }

    const demo = createDemoInvoices();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch {
      /* ignore */
    }
    return demo;
  }
}

function paymentTermDays(invoice: Invoice): number {
  const issued = parseIsoDate(invoice.issueDate);
  const due = parseIsoDate(invoice.dueDate);
  if (!issued || !due) return 14;
  return Math.max(Math.round((due.getTime() - issued.getTime()) / 86_400_000), 0);
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
