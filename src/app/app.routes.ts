import { Routes } from '@angular/router';

import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'invoices' },
  {
    path: 'invoices',
    title: 'Invoices · Invoice Generator',
    loadComponent: () => import('./features/invoice-list/invoice-list').then((m) => m.InvoiceList),
  },
  {
    path: 'invoices/new',
    title: 'New invoice · Invoice Generator',
    loadComponent: () => import('./features/invoice-editor/invoice-editor').then((m) => m.InvoiceEditor),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'invoices/:id',
    title: 'Edit invoice · Invoice Generator',
    loadComponent: () => import('./features/invoice-editor/invoice-editor').then((m) => m.InvoiceEditor),
    canDeactivate: [unsavedChangesGuard],
  },
  { path: '**', redirectTo: 'invoices' },
];
