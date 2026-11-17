import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { CURRENCIES, INVOICE_STATUSES, InvoiceDraft, emptyParty, toDraft } from '../../core/models/invoice.model';
import { InvoiceStore } from '../../core/services/invoice-store.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { ToastService } from '../../core/services/toast.service';
import { addDays, toIsoDate } from '../../core/utils/format';
import { calculateTotals, lineTotal } from '../../core/utils/invoice-calc';
import { Icon } from '../../shared/components/icon/icon';
import { InvoicePreview } from '../../shared/components/invoice-preview/invoice-preview';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { InvoiceForm, InvoiceFormFactory, formToDraft } from './invoice-form';

@Component({
  selector: 'app-invoice-editor',
  imports: [ReactiveFormsModule, RouterLink, TitleCasePipe, Icon, InvoicePreview, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-editor.html',
  styleUrl: './invoice-editor.scss',
})
export class InvoiceEditor implements OnDestroy, HasUnsavedChanges {
  private readonly store = inject(InvoiceStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly formFactory = inject(InvoiceFormFactory);
  private readonly pdf = inject(PdfExportService);

  /** Route param, undefined when creating a new invoice. */
  readonly id = input<string>();

  protected readonly currencies = CURRENCIES;
  protected readonly statuses = INVOICE_STATUSES;
  protected readonly parties = [
    { key: 'from', title: 'From', nameLabel: 'Business name', namePlaceholder: 'Your company' },
    { key: 'to', title: 'Bill to', nameLabel: 'Client name', namePlaceholder: 'Client company' },
  ] as const;

  protected readonly form = signal<InvoiceForm>(this.formFactory.createForm(this.newDraft()));
  /** Plain snapshot of the form, kept in sync so totals and the preview stay live. */
  protected readonly draft = signal<InvoiceDraft>(formToDraft(this.form()));
  protected readonly notFound = signal(false);
  protected readonly submitted = signal(false);
  protected readonly exporting = signal(false);

  protected readonly isNew = computed(() => !this.id());
  protected readonly totals = computed(() => {
    const d = this.draft();
    return calculateTotals(d.items, d.taxRate, d.discountType, d.discount);
  });

  private formSub?: Subscription;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  protected get items() {
    return this.form().controls.items;
  }

  protected lineAmount(index: number): number {
    const item = this.draft().items[index];
    return item ? lineTotal(item) : 0;
  }

  protected addItem(): void {
    this.items.push(this.formFactory.item());
  }

  protected removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.form().markAsDirty();
    }
  }

  protected save(): void {
    const form = this.form();
    this.submitted.set(true);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const draft = formToDraft(form);
    const id = this.id();
    form.markAsPristine();
    this.submitted.set(false);

    if (id) {
      this.store.update(id, draft);
      this.toast.show('Invoice saved');
    } else {
      const created = this.store.create(draft);
      this.toast.show('Invoice created');
      this.router.navigate(['/invoices', created.id], { replaceUrl: true });
    }
  }

  protected duplicate(): void {
    const id = this.id();
    if (!id || !this.canLeave()) return;
    const copy = this.store.duplicate(id);
    if (copy) {
      this.form().markAsPristine();
      this.toast.show(`Created ${copy.number} as a copy`);
      this.router.navigate(['/invoices', copy.id]);
    }
  }

  protected print(): void {
    window.print();
  }

  protected async downloadPdf(): Promise<void> {
    this.exporting.set(true);
    try {
      await this.pdf.download(this.draft());
    } catch (error) {
      console.error(error);
      this.toast.show('Could not generate the PDF, please try again');
    } finally {
      this.exporting.set(false);
    }
  }

  /** Used by the route guard to warn about unsaved edits. */
  canLeave(): boolean {
    return !this.form().dirty || confirm('You have unsaved changes. Leave without saving?');
  }

  protected invalid(path: string): boolean {
    const control = this.form().get(path);
    return !!control && control.invalid && control.touched;
  }

  private load(id: string | undefined): void {
    this.notFound.set(false);
    this.submitted.set(false);

    if (!id) {
      this.setForm(this.newDraft());
      return;
    }

    const invoice = this.store.getById(id);
    if (invoice) {
      this.setForm(toDraft(invoice));
    } else {
      this.notFound.set(true);
    }
  }

  private setForm(draft: InvoiceDraft): void {
    const form = this.formFactory.createForm(draft);
    this.formSub?.unsubscribe();
    this.formSub = form.valueChanges.subscribe(() => this.draft.set(formToDraft(form)));
    this.form.set(form);
    this.draft.set(formToDraft(form));
  }

  private newDraft(): InvoiceDraft {
    const today = new Date();
    return {
      number: this.store.nextNumber(today),
      status: 'draft',
      issueDate: toIsoDate(today),
      dueDate: toIsoDate(addDays(today, 14)),
      currency: 'USD',
      from: this.store.lastSender(),
      to: emptyParty(),
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0,
      discountType: 'percent',
      discount: 0,
      notes: 'Thank you for your business!',
    };
  }
}
