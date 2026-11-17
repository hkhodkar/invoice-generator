import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Invoice, InvoiceStatus } from '../../core/models/invoice.model';
import { InvoiceStore } from '../../core/services/invoice-store.service';
import { calculateTotals, isOverdue } from '../../core/utils/invoice-calc';
import { Icon } from '../../shared/components/icon/icon';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ShortDatePipe } from '../../shared/pipes/short-date.pipe';

type StatusFilter = InvoiceStatus | 'all' | 'overdue';

interface InvoiceRow {
  invoice: Invoice;
  total: number;
  overdue: boolean;
}

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, Icon, StatusBadge, MoneyPipe, ShortDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceList {
  private readonly store = inject(InvoiceStore);
  private readonly router = inject(Router);

  protected readonly filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
  ];

  protected readonly query = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');

  private readonly rows = computed<InvoiceRow[]>(() => {
    const today = new Date();
    return this.store.invoices().map((invoice) => ({
      invoice,
      total: calculateTotals(invoice.items, invoice.taxRate, invoice.discountType, invoice.discount).total,
      overdue: isOverdue(invoice, today),
    }));
  });

  protected readonly stats = computed(() => {
    const rows = this.rows();
    return [
      { filter: 'all' as const, label: 'All invoices', value: rows.length },
      { filter: 'draft' as const, label: 'Drafts', value: rows.filter((r) => r.invoice.status === 'draft').length },
      { filter: 'sent' as const, label: 'Awaiting payment', value: rows.filter((r) => r.invoice.status === 'sent').length },
      { filter: 'overdue' as const, label: 'Overdue', value: rows.filter((r) => r.overdue).length },
      { filter: 'paid' as const, label: 'Paid', value: rows.filter((r) => r.invoice.status === 'paid').length },
    ];
  });

  protected readonly filteredRows = computed(() => {
    const term = this.query().trim().toLowerCase();
    const status = this.statusFilter();

    return this.rows().filter(({ invoice, overdue }) => {
      if (status === 'overdue' && !overdue) return false;
      if (status !== 'all' && status !== 'overdue' && invoice.status !== status) return false;
      if (!term) return true;
      return [invoice.number, invoice.to.name, invoice.to.email].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  });

  protected readonly hasInvoices = computed(() => this.store.count() > 0);

  protected open(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  protected duplicate(invoice: Invoice): void {
    const copy = this.store.duplicate(invoice.id);
    if (copy) this.router.navigate(['/invoices', copy.id]);
  }

  protected markPaid(invoice: Invoice): void {
    this.store.setStatus(invoice.id, 'paid');
  }

  protected remove(invoice: Invoice): void {
    if (confirm(`Delete invoice ${invoice.number}? This can't be undone.`)) {
      this.store.remove(invoice.id);
    }
  }

  protected clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
  }
}
