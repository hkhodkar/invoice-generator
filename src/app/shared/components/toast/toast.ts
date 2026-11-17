import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toast',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-region" aria-live="polite">
      @if (toast.message(); as message) {
        <div class="toast">
          <app-icon name="check" />
          {{ message }}
        </div>
      }
    </div>
  `,
  styles: `
    .toast-region {
      position: fixed;
      bottom: 24px;
      left: 50%;
      z-index: 100;
      transform: translateX(-50%);
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      background: #1b2232;
      color: #fff;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(16, 24, 40, 0.2);
      animation: toast-in 0.18s ease-out;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    @media print {
      .toast-region {
        display: none;
      }
    }
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
