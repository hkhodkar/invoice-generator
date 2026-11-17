import { TestBed } from '@angular/core/testing';

import { createDemoInvoices } from '../../../core/data/demo-invoices';
import { toDraft } from '../../../core/models/invoice.model';
import { InvoicePreview } from './invoice-preview';

describe('InvoicePreview', () => {
  async function render(overrides = {}) {
    const fixture = TestBed.createComponent(InvoicePreview);
    fixture.componentRef.setInput('invoice', { ...toDraft(createDemoInvoices()[1]), ...overrides });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows every line item and the grand total', async () => {
    const el = await render();

    expect(el.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(el.querySelector('.sum__total dd')?.textContent).toContain('€10,115.00');
  });

  it('shows nothing due once the invoice is paid', async () => {
    const el = await render({ status: 'paid' });

    expect(el.querySelector('.stamp')).toBeTruthy();
    expect(el.querySelector('.dates__due dd')?.textContent).toContain('€0.00');
  });
});
