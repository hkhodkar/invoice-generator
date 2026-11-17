import { Pipe, PipeTransform } from '@angular/core';

import { formatDate } from '../../core/utils/format';

@Pipe({ name: 'shortDate' })
export class ShortDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDate(value ?? '');
  }
}
