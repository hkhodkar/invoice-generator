import { TestBed } from '@angular/core/testing';

import { InvoiceDraft, emptyParty, toDraft } from '../models/invoice.model';
import { InvoiceStore, STORAGE_KEY } from './invoice-store.service';

function draft(overrides: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    number: 'INV-2026-0100',
    status: 'draft',
    issueDate: '2026-11-01',
    dueDate: '2026-11-15',
    currency: 'USD',
    from: { ...emptyParty(), name: 'Acme Design' },
    to: { ...emptyParty(), name: 'Globex' },
    items: [{ description: 'Consulting', quantity: 2, unitPrice: 100 }],
    taxRate: 0,
    discountType: 'percent',
    discount: 0,
    notes: '',
    ...overrides,
  };
}

describe('InvoiceStore', () => {
  let store: InvoiceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(InvoiceStore);
  });

  it('seeds demo invoices on first load and persists them', () => {
    expect(store.count()).toBe(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(3);
  });

  it('does not re-seed when the user has deleted everything', () => {
    store.invoices().forEach((invoice) => store.remove(invoice.id));

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(InvoiceStore);

    expect(reloaded.count()).toBe(0);
  });

  it('creates an invoice and saves it to localStorage', () => {
    const created = store.create(draft());

    expect(created.id).toBeTruthy();
    expect(store.getById(created.id)?.to.name).toBe('Globex');
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as { id: string }[];
    expect(saved.some((invoice) => invoice.id === created.id)).toBe(true);
  });

  it('updates an existing invoice but keeps its creation date', () => {
    const created = store.create(draft());
    const updated = store.update(created.id, { ...toDraft(created), notes: 'Updated' });

    expect(updated?.notes).toBe('Updated');
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(store.count()).toBe(4);
  });

  it('changes the status of an invoice', () => {
    store.setStatus('demo-atlas', 'paid');
    expect(store.getById('demo-atlas')?.status).toBe('paid');
  });

  it('duplicates an invoice as a new draft with the next number', () => {
    const copy = store.duplicate('demo-brightline');

    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe('demo-brightline');
    expect(copy!.status).toBe('draft');
    expect(copy!.number).not.toBe('INV-2026-0012');
    expect(copy!.items).toEqual(store.getById('demo-brightline')!.items);
    expect(store.count()).toBe(4);
  });

  it('removes an invoice', () => {
    store.remove('demo-harbor');
    expect(store.getById('demo-harbor')).toBeUndefined();
    expect(store.count()).toBe(2);
  });

  it('continues the numbering sequence for the given year', () => {
    expect(store.nextNumber(new Date(2026, 5, 1))).toBe('INV-2026-0015');
    expect(store.nextNumber(new Date(2027, 0, 1))).toBe('INV-2027-0001');
  });

  it('falls back to demo data when storage contains garbage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    TestBed.resetTestingModule();

    expect(TestBed.inject(InvoiceStore).count()).toBe(3);
  });
});
