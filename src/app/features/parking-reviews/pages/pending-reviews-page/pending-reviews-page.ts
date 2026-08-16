import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { requestOutcome, toDate } from '../../../../core/parking/request-status.util';
import {
  REVIEW_KIND_LONG_LABELS,
  ReviewItem,
  ReviewKind,
  parkingReviewItem,
  unassignmentReviewItem,
} from '../../../../core/parking/review-item.util';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { DateOrder } from '../../../../shared/components/request-timeline/request-timeline';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { UiPagination } from '../../../../shared/components/ui-pagination/ui-pagination';
import { ReviewRequestList } from '../../components/review-request-list/review-request-list';

type ReviewsView = 'pendientes' | 'revisadas';
type KindFilter = 'todas' | ReviewKind;
type ResultFilter = 'todos' | 'approved' | 'rejected';

interface ViewOption {
  value: ReviewsView;
  label: string;
}

const VIEWS: ViewOption[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'revisadas', label: 'Revisadas' },
];

const KIND_FILTERS: readonly { value: KindFilter; label: string }[] = [
  { value: 'todas', label: 'Todos los tipos' },
  { value: 'parking', label: REVIEW_KIND_LONG_LABELS.parking },
  { value: 'unassignment', label: REVIEW_KIND_LONG_LABELS.unassignment },
];

const RESULT_FILTERS: readonly { value: ResultFilter; label: string }[] = [
  { value: 'todos', label: 'Todos los resultados' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

const ALL_CYCLES = '';

const PAGE_SIZE = 10;

const DATE_ORDERS: readonly { value: DateOrder; label: string }[] = [
  { value: 'newest', label: 'Más recientes primero' },
  { value: 'oldest', label: 'Más antiguas primero' },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function searchableText(item: ReviewItem): string {
  return normalize(
    [item.numberPlate, item.vehicleType, item.applicantName, item.username, `#${item.id}`]
      .filter(Boolean)
      .join(' '),
  );
}

function matchesSearch(item: ReviewItem, term: string): boolean {
  if (!term) {
    return true;
  }
  const haystack = searchableText(item);
  return normalize(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function sortByDate(items: readonly ReviewItem[], order: DateOrder): ReviewItem[] {
  const direction = order === 'newest' ? -1 : 1;
  return [...items].sort((a, b) => {
    const timeA = toDate(a.dateRequest)?.getTime() ?? 0;
    const timeB = toDate(b.dateRequest)?.getTime() ?? 0;
    const difference = timeA !== timeB ? timeA - timeB : a.id - b.id;
    return difference * direction;
  });
}

@Component({
  selector: 'app-pending-reviews-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReviewRequestList,
    UiAlert,
    UiButton,
    UiCard,
    UiFormField,
    UiIcon,
    UiPagination,
  ],
  templateUrl: './pending-reviews-page.html',
  styleUrl: './pending-reviews-page.scss',
})
export class PendingReviewsPage {
  private readonly parkingReviewService = inject(ParkingReviewService);
  private readonly unassignmentService = inject(VehicleUnassignmentService);
  private readonly currentCycleService = inject(CurrentCycleService);

  readonly vista = input<string>();
  readonly respondida = input<string>();
  readonly resultado = input<string>();
  readonly tipo = input<string>();

  protected readonly views = VIEWS;
  protected readonly kindFilters = KIND_FILTERS;
  protected readonly resultFilters = RESULT_FILTERS;
  protected readonly allCycles = ALL_CYCLES;
  protected readonly dateOrders = DATE_ORDERS;
  protected readonly pageSize = PAGE_SIZE;

  protected readonly currentCycleName = this.currentCycleService.name;

  protected readonly isLoading = computed(
    () => this.parkingReviewService.isLoading() || this.unassignmentService.acceptorIsLoading(),
  );
  protected readonly hasFailed = computed(
    () => this.parkingReviewService.hasFailed() || this.unassignmentService.acceptorHasFailed(),
  );

  protected readonly view = computed<ReviewsView>(() =>
    this.vista() === 'revisadas' ? 'revisadas' : 'pendientes',
  );

  private readonly reviewedItems = computed<ReviewItem[]>(() => [
    ...this.parkingReviewService.reviewedRequests().map(parkingReviewItem),
    ...this.unassignmentService.reviewedAcceptorRequests().map(unassignmentReviewItem),
  ]);

  private readonly pendingItems = computed<ReviewItem[]>(() =>
    this.parkingReviewService.pendingRequests().map(parkingReviewItem),
  );

  protected readonly pendingUnassignmentCount = computed(
    () => this.unassignmentService.pendingAcceptorRequests().length,
  );

  private readonly baseItems = computed(() =>
    this.view() === 'revisadas' ? this.reviewedItems() : this.pendingItems(),
  );

  protected readonly searchTerm = signal('');
  private readonly cycleFilter = signal(ALL_CYCLES);
  private readonly kindFilter = signal<KindFilter>('todas');
  protected readonly resultFilter = signal<ResultFilter>('todos');
  protected readonly dateOrder = signal<DateOrder>('newest');
  private readonly requestedPage = signal(1);

  protected readonly selectedKind = computed<KindFilter>(() =>
    this.view() === 'revisadas' ? this.kindFilter() : 'parking',
  );

  protected readonly showKindColumn = computed(
    () => this.view() === 'revisadas' && this.selectedKind() === 'todas',
  );

  protected readonly showCycleFilter = computed(() => this.selectedKind() !== 'unassignment');

  protected readonly cycles = computed(() =>
    [...new Set(this.baseItems().map((item) => item.cycle ?? '').filter(Boolean))].sort((a, b) =>
      b.localeCompare(a),
    ),
  );

  protected readonly selectedCycle = computed(() => {
    if (!this.showCycleFilter()) {
      return ALL_CYCLES;
    }
    const selected = this.cycleFilter();
    return this.cycles().includes(selected) ? selected : ALL_CYCLES;
  });

  protected readonly filteredRequests = computed(() => {
    const cycle = this.selectedCycle();
    const term = this.searchTerm();
    const kind = this.selectedKind();
    const result = this.view() === 'revisadas' ? this.resultFilter() : 'todos';

    const matching = this.baseItems().filter((item) => {
      if (kind !== 'todas' && item.kind !== kind) {
        return false;
      }
      if (cycle !== ALL_CYCLES && item.cycle !== cycle) {
        return false;
      }
      if (result !== 'todos' && requestOutcome(item) !== result) {
        return false;
      }
      return matchesSearch(item, term);
    });

    return sortByDate(matching, this.dateOrder());
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRequests().length / PAGE_SIZE)),
  );

  protected readonly page = computed(() => Math.min(this.requestedPage(), this.totalPages()));

  protected readonly visibleRequests = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredRequests().slice(start, start + PAGE_SIZE);
  });

  protected readonly totalRequests = computed(() => this.baseItems().length);

  protected readonly hasRequests = computed(() => this.totalRequests() > 0);

  protected readonly hasActiveFilters = computed(
    () =>
      this.selectedCycle() !== ALL_CYCLES ||
      this.searchTerm().trim().length > 0 ||
      this.selectedKind() !== (this.view() === 'revisadas' ? 'todas' : 'parking') ||
      this.resultFilter() !== 'todos',
  );


  protected readonly feedback = computed(() => {
    const requestId = this.respondida();
    if (!requestId) {
      return null;
    }
    return this.resultado() === 'rechazada'
      ? `La solicitud #${requestId} fue rechazada correctamente.`
      : `La solicitud #${requestId} fue aceptada correctamente.`;
  });

  constructor() {
    effect(() => {
      const requested = this.tipo();
      untracked(() => {
        if (requested === 'parking' || requested === 'unassignment') {
          this.kindFilter.set(requested);
        }
      });
    });

    effect(() => {
      this.view();
      this.searchTerm();
      this.cycleFilter();
      this.kindFilter();
      this.resultFilter();
      this.dateOrder();
      untracked(() => this.requestedPage.set(1));
    });
  }

  setSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearchTerm(): void {
    this.searchTerm.set('');
  }

  setCycleFilter(event: Event): void {
    this.cycleFilter.set((event.target as HTMLSelectElement).value);
  }

  setKindFilter(event: Event): void {
    this.kindFilter.set((event.target as HTMLSelectElement).value as KindFilter);
  }

  setResultFilter(event: Event): void {
    this.resultFilter.set((event.target as HTMLSelectElement).value as ResultFilter);
  }

  setDateOrder(event: Event): void {
    this.dateOrder.set((event.target as HTMLSelectElement).value as DateOrder);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.cycleFilter.set(ALL_CYCLES);
    this.kindFilter.set('todas');
    this.resultFilter.set('todos');
  }

  goToPage(page: number): void {
    this.requestedPage.set(page);
  }

  countFor(view: ReviewsView): number {
    return view === 'revisadas' ? this.reviewedItems().length : this.pendingItems().length;
  }

  reload(): void {
    this.parkingReviewService.reload();
    this.unassignmentService.reloadAcceptor();
    this.currentCycleService.reload();
  }
}
