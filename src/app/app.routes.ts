import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'invoices' },
  {
    path: 'invoices',
    title: 'Invoices · Invoice Generator',
    loadComponent: () => import('./features/invoice-list/invoice-list').then((m) => m.InvoiceList),
  },
  { path: '**', redirectTo: 'invoices' },
];
