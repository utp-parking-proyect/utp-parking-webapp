import { Pipe, PipeTransform } from '@angular/core';
import { statusLabel } from '../../core/parking/status-labels';

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    return statusLabel(status);
  }
}
