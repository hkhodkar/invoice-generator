import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  canLeave(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  component.canLeave();
