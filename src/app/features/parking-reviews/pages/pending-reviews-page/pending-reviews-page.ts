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
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { toDate } from '../../../../core/parking/request-status.util';
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

interface ViewOption {
  value: ReviewsView;
  label: string;
}

const VIEWS: ViewOption[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'revisadas', label: 'Revisadas' },
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

function cycleOf(request: ParkingRequestInformation): string {
  return request.applicant?.numberCycle?.trim() ?? '';
}

function searchableText(request: ParkingRequestInformation): string {
  const { nameApplicant, lastNameApplicant, usernameApplicant } = request.applicant ?? {};
  const { numberPlate, vehicleType } = request.vehicle ?? {};
  return normalize(
    [
      numberPlate,
      vehicleType,
      nameApplicant,
      lastNameApplicant,
      usernameApplicant,
      `#${request.idRequest}`,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function matchesSearch(request: ParkingRequestInformation, term: string): boolean {
  if (!term) {
    return true;
  }
  const haystack = searchableText(request);
  return normalize(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function sortByDate(
  requests: readonly ParkingRequestInformation[],
  order: DateOrder,
): ParkingRequestInformation[] {
  const direction = order === 'newest' ? -1 : 1;
  return [...requests].sort((a, b) => {
    const timeA = toDate(a.dateRequest)?.getTime() ?? 0;
    const timeB = toDate(b.dateRequest)?.getTime() ?? 0;
    const difference = timeA !== timeB ? timeA - timeB : a.idRequest - b.idRequest;
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
  private readonly currentCycleService = inject(CurrentCycleService);

  readonly vista = input<string>();
  readonly respondida = input<string>();
  readonly resultado = input<string>();

  protected readonly views = VIEWS;
  protected readonly allCycles = ALL_CYCLES;
  protected readonly dateOrders = DATE_ORDERS;
  protected readonly pageSize = PAGE_SIZE;

  protected readonly currentCycleName = this.currentCycleService.name;
  protected readonly isLoading = this.parkingReviewService.isLoading;
  protected readonly hasFailed = this.parkingReviewService.hasFailed;
  protected readonly pendingCount = computed(
    () => this.parkingReviewService.pendingRequests().length,
  );

  protected readonly view = computed<ReviewsView>(() =>
    this.vista() === 'revisadas' ? 'revisadas' : 'pendientes',
  );

  private readonly baseRequests = computed(() =>
    this.view() === 'revisadas'
      ? this.parkingReviewService.reviewedRequests()
      : this.parkingReviewService.pendingRequests(),
  );

  protected readonly cycles = computed(() =>
    [...new Set(this.baseRequests().map(cycleOf).filter(Boolean))].sort((a, b) =>
      b.localeCompare(a),
    ),
  );

  protected readonly searchTerm = signal('');
  private readonly cycleFilter = signal(ALL_CYCLES);
  protected readonly dateOrder = signal<DateOrder>('newest');
  private readonly requestedPage = signal(1);

  protected readonly selectedCycle = computed(() => {
    const selected = this.cycleFilter();
    return this.cycles().includes(selected) ? selected : ALL_CYCLES;
  });

  protected readonly filteredRequests = computed(() => {
    const cycle = this.selectedCycle();
    const term = this.searchTerm();
    const matching = this.baseRequests().filter(
      (request) =>
        (cycle === ALL_CYCLES || cycleOf(request) === cycle) && matchesSearch(request, term),
    );
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

  protected readonly totalRequests = computed(() => this.baseRequests().length);

  protected readonly hasRequests = computed(() => this.totalRequests() > 0);

  protected readonly hasActiveFilters = computed(
    () => this.selectedCycle() !== ALL_CYCLES || this.searchTerm().trim().length > 0,
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
      this.view();
      this.searchTerm();
      this.cycleFilter();
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

  setDateOrder(event: Event): void {
    this.dateOrder.set((event.target as HTMLSelectElement).value as DateOrder);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.cycleFilter.set(ALL_CYCLES);
  }

  goToPage(page: number): void {
    this.requestedPage.set(page);
  }

  countFor(view: ReviewsView): number {
    return view === 'revisadas'
      ? this.parkingReviewService.reviewedRequests().length
      : this.pendingCount();
  }

  reload(): void {
    this.parkingReviewService.reload();
    this.currentCycleService.reload();
  }
}
