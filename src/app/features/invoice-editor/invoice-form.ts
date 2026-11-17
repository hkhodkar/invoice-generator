import { inject, Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { DiscountType, InvoiceDraft, InvoiceStatus, LineItem, Party } from '../../core/models/invoice.model';

/** Builds the typed reactive form used by the editor and converts it back to a draft. */
@Injectable({ providedIn: 'root' })
export class InvoiceFormFactory {
  private readonly fb = inject(NonNullableFormBuilder);

  createForm(draft: InvoiceDraft) {
    return this.fb.group(
      {
        number: [draft.number, Validators.required],
        status: this.fb.control<InvoiceStatus>(draft.status),
        issueDate: [draft.issueDate, Validators.required],
        dueDate: [draft.dueDate, Validators.required],
        currency: [draft.currency],
        from: this.party(draft.from),
        to: this.party(draft.to),
        items: this.fb.array(draft.items.map((item) => this.item(item))),
        taxRate: [draft.taxRate, [Validators.min(0), Validators.max(100)]],
        discountType: this.fb.control<DiscountType>(draft.discountType),
        discount: [draft.discount, Validators.min(0)],
        notes: [draft.notes],
      },
      { validators: dueDateNotBeforeIssue },
    );
  }

  item(item: LineItem = { description: '', quantity: 1, unitPrice: 0 }) {
    return this.fb.group({
      description: [item.description, Validators.required],
      quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
    });
  }

  private party(party: Party) {
    return this.fb.group({
      name: [party.name, Validators.required],
      email: [party.email, Validators.email],
      phone: [party.phone],
      address: [party.address],
      taxId: [party.taxId],
    });
  }
}

export type InvoiceForm = ReturnType<InvoiceFormFactory['createForm']>;
export type LineItemForm = ReturnType<InvoiceFormFactory['item']>;
export type LineItemsArray = FormArray<LineItemForm>;

export function formToDraft(form: InvoiceForm): InvoiceDraft {
  const value = form.getRawValue();
  return {
    ...value,
    from: { ...value.from },
    to: { ...value.to },
    items: value.items.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
    })),
    taxRate: toNumber(value.taxRate),
    discount: toNumber(value.discount),
  };
}

// number inputs give back null when the field is cleared
function toNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function dueDateNotBeforeIssue(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const issue = group.get('issueDate')?.value as string;
  const due = group.get('dueDate')?.value as string;
  return issue && due && due < issue ? { dueBeforeIssue: true } : null;
}
