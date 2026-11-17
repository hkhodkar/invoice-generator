import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { InvoiceStatus } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge--' + variant()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 10px 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;
      white-space: nowrap;

      &::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
    }
    .badge--draft {
      background: #f2f4f7;
      color: #475467;
    }
    .badge--sent {
      background: var(--primary-soft);
      color: var(--primary);
    }
    .badge--paid {
      background: var(--success-soft);
      color: var(--success);
    }
    .badge--overdue {
      background: var(--danger-soft);
      color: var(--danger);
    }
  `,
})
export class StatusBadge {
  readonly status = input.required<InvoiceStatus>();
  readonly overdue = input(false);

  protected readonly variant = computed(() => (this.overdue() ? 'overdue' : this.status()));
  protected readonly label = computed(() => {
    const value = this.variant();
    return value.charAt(0).toUpperCase() + value.slice(1);
  });
}
