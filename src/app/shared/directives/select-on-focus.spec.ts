import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SelectOnFocus } from './select-on-focus';

@Component({
  imports: [SelectOnFocus],
  template: `<input type="text" value="0" appSelectOnFocus />`,
})
class Host {}

describe('SelectOnFocus', () => {
  it('selects the value when the input gets focus', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.dispatchEvent(new Event('focus'));

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(1);
  });

  it('keeps the selection on the first mouseup after focus', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.dispatchEvent(new Event('focus'));
    const first = new MouseEvent('mouseup', { cancelable: true });
    input.dispatchEvent(first);
    const second = new MouseEvent('mouseup', { cancelable: true });
    input.dispatchEvent(second);

    expect(first.defaultPrevented).toBe(true);
    expect(second.defaultPrevented).toBe(false);
  });

  it('does not block typing', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.dispatchEvent(new Event('focus'));
    const key = new KeyboardEvent('keydown', { key: '5', cancelable: true });
    input.dispatchEvent(key);

    expect(key.defaultPrevented).toBe(false);
  });
});
