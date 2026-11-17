import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { InvoiceStore } from './core/services/invoice-store.service';
import { Header } from './layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly store = inject(InvoiceStore);

  protected resetDemo(): void {
    if (confirm('Replace all invoices with the demo data? Your own invoices will be removed.')) {
      this.store.resetDemoData();
    }
  }
}
