import { TestBed } from '@angular/core/testing';

import { createDemoInvoices } from '../data/demo-invoices';
import { toDraft } from '../models/invoice.model';
import { PdfExportService } from './pdf-export.service';

describe('PdfExportService', () => {
  it('renders the invoice details and totals into a single A4 page', async () => {
    const service = TestBed.inject(PdfExportService);
    const doc = await service.build(toDraft(createDemoInvoices()[1]));
    const output = doc.output();

    expect(doc.getNumberOfPages()).toBe(1);
    expect(output).toContain('INV-2026-0013');
    expect(output).toContain('Atlas Logistics GmbH');
    expect(output).toContain('10,115.00');
  });
});
