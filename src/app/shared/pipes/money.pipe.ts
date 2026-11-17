import { Pipe, PipeTransform } from '@angular/core';

import { formatMoney } from '../../core/utils/format';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(amount: number | null | undefined, currency: string): string {
    return formatMoney(amount ?? 0, currency);
  }
}
