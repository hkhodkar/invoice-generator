import { TestBed } from '@angular/core/testing';

import { createDemoInvoices } from '../../core/data/demo-invoices';
import { toDraft } from '../../core/models/invoice.model';
import { InvoiceFormFactory, formToDraft } from './invoice-form';

describe('InvoiceFormFactory', () => {
  let factory: InvoiceFormFactory;
  const demo = toDraft(createDemoInvoices()[0]);

  beforeEach(() => {
    factory = TestBed.inject(InvoiceFormFactory);
  });

  it('round-trips an invoice through the form unchanged', () => {
    const form = factory.createForm(demo);
    expect(formToDraft(form)).toEqual(demo);
  });

  it('is invalid without a client name', () => {
    const form = factory.createForm(demo);
    form.controls.to.controls.name.setValue('');
    expect(form.valid).toBe(false);
  });

  it('rejects a due date before the issue date', () => {
    const form = factory.createForm(demo);
    form.patchValue({ issueDate: '2026-11-10', dueDate: '2026-11-01' });
    expect(form.hasError('dueBeforeIssue')).toBe(true);
  });

  it('converts cleared number inputs to zero', () => {
    const form = factory.createForm(demo);
    form.controls.taxRate.setValue(null as unknown as number);
    form.controls.items.at(0).controls.quantity.setValue(null as unknown as number);

    const draft = formToDraft(form);
    expect(draft.taxRate).toBe(0);
    expect(draft.items[0].quantity).toBe(0);
  });
});
