import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { InvoiceDraft } from '../../../core/models/invoice.model';
import { calculateTotals, lineTotal } from '../../../core/utils/invoice-calc';
import { MoneyPipe } from '../../pipes/money.pipe';
import { ShortDatePipe } from '../../pipes/short-date.pipe';

/** The invoice as the client will see it. Also what gets printed. */
@Component({
  selector: 'app-invoice-preview',
  imports: [MoneyPipe, ShortDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-preview.html',
  styleUrl: './invoice-preview.scss',
})
export class InvoicePreview {
  readonly invoice = input.required<InvoiceDraft>();

  protected readonly totals = computed(() => {
    const { items, taxRate, discountType, discount } = this.invoice();
    return calculateTotals(items, taxRate, discountType, discount);
  });

  protected readonly lines = computed(() =>
    this.invoice()
      .items.filter((item) => item.description.trim() || item.unitPrice)
      .map((item) => ({ ...item, amount: lineTotal(item) })),
  );

  protected readonly discountLabel = computed(() => {
    const { discountType, discount } = this.invoice();
    return discountType === 'percent' ? `Discount (${discount}%)` : 'Discount';
  });
}
