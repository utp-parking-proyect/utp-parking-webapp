import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { WorkflowEntry } from '../../../core/parking/models/parking-request.model';
import { toDate } from '../../../core/parking/request-status.util';
import { StatusLabelPipe } from '../../pipes/status-label-pipe';
import { UiIcon } from '../ui-icon/ui-icon';

export type DateOrder = 'newest' | 'oldest';

function timeOf(entry: WorkflowEntry): number {
  return toDate(entry.dateStatusChange)?.getTime() ?? 0;
}

@Component({
  selector: 'app-request-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, StatusLabelPipe, UiIcon],
  templateUrl: './request-timeline.html',
  styleUrl: './request-timeline.scss',
})
export class RequestTimeline {
  readonly entries = input.required<readonly WorkflowEntry[]>();

  protected readonly order = signal<DateOrder>('newest');

  protected readonly sortedEntries = computed(() => {
    const direction = this.order() === 'newest' ? -1 : 1;
    return this.entries()
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => {
        const difference = timeOf(a.entry) - timeOf(b.entry);
        return (difference !== 0 ? difference : a.index - b.index) * direction;
      })
      .map((item) => item.entry);
  });

  protected readonly orderLabel = computed(() =>
    this.order() === 'newest' ? 'Más recientes primero' : 'Más antiguas primero',
  );

  toggleOrder(): void {
    this.order.update((order) => (order === 'newest' ? 'oldest' : 'newest'));
  }

  entryDate(entry: WorkflowEntry): Date | null {
    return toDate(entry.dateStatusChange);
  }
}
