import { Directive, ElementRef, inject } from '@angular/core';

/** Selects the field's content on focus, so typing replaces a default like 0. */
@Directive({
  selector: 'input[appSelectOnFocus]',
  host: {
    '(focus)': 'onFocus()',
    '(mouseup)': 'onMouseUp($event)',
    '(keydown)': 'reset()',
    '(blur)': 'reset()',
  },
})
export class SelectOnFocus {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private pending = false;

  onFocus(): void {
    this.el.nativeElement.select();
    this.pending = true;
  }

  // Safari drops the selection on the mouseup that follows a click-focus
  onMouseUp(event: MouseEvent): void {
    if (this.pending) {
      event.preventDefault();
      this.pending = false;
    }
  }

  reset(): void {
    this.pending = false;
  }
}
