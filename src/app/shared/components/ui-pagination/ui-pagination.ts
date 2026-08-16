import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

export type PaginationSlot = number | 'gap';

const SIBLINGS = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildSlots(page: number, totalPages: number): PaginationSlot[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = clamp(page - SIBLINGS, 2, totalPages - 2 * SIBLINGS - 1);
  const end = start + 2 * SIBLINGS;
  const slots: PaginationSlot[] = [1];

  if (start > 2) {
    slots.push('gap');
  }

  for (let current = start; current <= end; current += 1) {
    slots.push(current);
  }

  if (end < totalPages - 1) {
    slots.push('gap');
  }

  slots.push(totalPages);
  return slots;
}

@Component({
  selector: 'app-ui-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon],
  templateUrl: './ui-pagination.html',
  styleUrl: './ui-pagination.scss',
})
export class UiPagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly itemLabel = input('resultados');

  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );

  protected readonly currentPage = computed(() => clamp(this.page(), 1, this.totalPages()));

  protected readonly rangeStart = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalItems()),
  );

  protected readonly slots = computed(() => buildSlots(this.currentPage(), this.totalPages()));

  protected readonly isFirst = computed(() => this.currentPage() <= 1);
  protected readonly isLast = computed(() => this.currentPage() >= this.totalPages());

  goTo(page: number): void {
    const target = clamp(page, 1, this.totalPages());
    if (target !== this.currentPage()) {
      this.pageChange.emit(target);
    }
  }

  previous(): void {
    this.goTo(this.currentPage() - 1);
  }

  next(): void {
    this.goTo(this.currentPage() + 1);
  }
}
