import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { toDate } from '../../../../core/parking/request-status.util';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { DateOrder } from '../../../../shared/components/request-timeline/request-timeline';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiDialog } from '../../../../shared/components/ui-dialog/ui-dialog';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { RequestCard } from '../../components/request-card/request-card';
import { UnassignmentRequestCard } from '../../components/unassignment-request-card/unassignment-request-card';

type RequestsView = 'todas' | 'en-curso' | 'historial';

export type RequestKind = 'todas' | 'estacionamiento' | 'desasignacion';

export type RequestItem =
  | { kind: 'estacionamiento'; key: string; date: string; answered: boolean; cycle: string;
      parking: ParkingRequestInformation }
  | { kind: 'desasignacion'; key: string; date: string; answered: boolean;
      unassignment: VehicleUnassignmentRequestDetail };

interface KindOption {
  value: RequestKind;
  label: string;
}

const KINDS: KindOption[] = [
  { value: 'todas', label: 'Todas las solicitudes' },
  { value: 'estacionamiento', label: 'Ingreso a estacionamiento' },
  { value: 'desasignacion', label: 'Desasignación de vehículo' },
];

interface ViewOption {
  value: RequestsView;
  label: string;
}

const VIEWS: ViewOption[] = [
  { value: 'todas', label: 'Ciclo actual' },
  { value: 'en-curso', label: 'En curso' },
  { value: 'historial', label: 'Historial' },
];

const ALL_CYCLES = '';

const DATE_ORDERS: readonly { value: DateOrder; label: string }[] = [
  { value: 'newest', label: 'Más recientes primero' },
  { value: 'oldest', label: 'Más antiguas primero' },
];

function cycleOf(request: ParkingRequestInformation): string {
  return request.applicant.numberCycle?.trim() ?? '';
}

function sortByDate(items: RequestItem[], order: DateOrder): RequestItem[] {
  const direction = order === 'newest' ? -1 : 1;
  return [...items].sort((a, b) => {
    const timeA = toDate(a.date)?.getTime() ?? 0;
    const timeB = toDate(b.date)?.getTime() ?? 0;
    const difference = timeA !== timeB ? timeA - timeB : a.key.localeCompare(b.key);
    return difference * direction;
  });
}

function isFromCycle(request: ParkingRequestInformation, cycleName: string | null): boolean {
  return cycleName === null || cycleOf(request) === cycleName;
}

function matchesView(item: RequestItem, view: RequestsView, cycleName: string | null): boolean {
  if (item.kind === 'desasignacion') {
    return view === 'en-curso' ? !item.answered : true;
  }

  switch (view) {
    case 'en-curso':
      return !item.answered && isFromCycle(item.parking, cycleName);
    case 'historial':
      return true;
    default:
      return isFromCycle(item.parking, cycleName);
  }
}

@Component({
  selector: 'app-my-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RequestCard,
    UnassignmentRequestCard,
    UiAlert,
    UiButton,
    UiCard,
    UiDialog,
    UiFormField,
    UiIcon,
  ],
  templateUrl: './my-requests-page.html',
  styleUrl: './my-requests-page.scss',
})
export class MyRequestsPage {
  private readonly parkingRequestService = inject(ParkingRequestService);
  private readonly currentCycleService = inject(CurrentCycleService);
  private readonly unassignmentService = inject(VehicleUnassignmentService);

  readonly vista = input<string>();

  protected readonly views = VIEWS;
  protected readonly kinds = KINDS;
  protected readonly requests = this.parkingRequestService.requests;
  protected readonly currentCycleName = this.currentCycleService.name;
  protected readonly isLoading = computed(
    () =>
      this.parkingRequestService.isLoading() ||
      this.currentCycleService.isLoading() ||
      this.unassignmentService.isLoading(),
  );
  protected readonly hasFailed = computed(
    () => this.parkingRequestService.hasFailed() || this.unassignmentService.hasFailed(),
  );

  protected readonly items = computed<RequestItem[]>(() => {
    const parking = this.requests().map<RequestItem>((request) => ({
      kind: 'estacionamiento',
      key: `p-${request.idRequest}`,
      date: request.dateRequest,
      answered: !!request.dateResponse,
      cycle: cycleOf(request),
      parking: request,
    }));

    const unassignments = this.unassignmentService.myRequests().map<RequestItem>((request) => ({
      kind: 'desasignacion',
      key: `u-${request.idUnassignmentRequest}`,
      date: request.dateRequest,
      answered: !!request.dateResponse,
      unassignment: request,
    }));

    return [...parking, ...unassignments];
  });
  protected readonly maxRequestsPerCycle = this.parkingRequestService.maxRequestsPerCycle;
  protected readonly cycleLimitReached = this.parkingRequestService.hasReachedCycleLimit;
  protected readonly cycleRequests = computed(
    () => this.parkingRequestService.currentCycleRequests().length,
  );

  protected readonly view = computed<RequestsView>(() => {
    const requested = this.vista();
    return VIEWS.some((option) => option.value === requested)
      ? (requested as RequestsView)
      : 'todas';
  });

  protected readonly allCycles = ALL_CYCLES;

  protected readonly cycles = computed(() => [
    ...new Set(this.requests().map(cycleOf).filter(Boolean)),
  ]);

  protected readonly showCycleFilter = computed(
    () => this.view() === 'historial' && this.cycles().length > 0
      && this.kindFilter() !== 'desasignacion',
  );

  private readonly cycleFilter = signal(ALL_CYCLES);

  protected readonly selectedCycle = computed(() => {
    const selected = this.cycleFilter();
    return this.cycles().includes(selected) ? selected : ALL_CYCLES;
  });

  protected readonly dateOrders = DATE_ORDERS;
  protected readonly dateOrder = signal<DateOrder>('newest');
  protected readonly kindFilter = signal<RequestKind>('todas');

  private readonly viewItems = computed(() =>
    this.items().filter((item) => matchesView(item, this.view(), this.currentCycleName())),
  );

  protected readonly totalRequests = computed(() => this.viewItems().length);

  protected readonly hasActiveFilters = computed(
    () => this.selectedCycle() !== ALL_CYCLES || this.kindFilter() !== 'todas',
  );

  protected readonly visibleRequests = computed(() => {
    const view = this.view();
    const cycle = this.selectedCycle();
    const kind = this.kindFilter();

    const matching = this.viewItems().filter((item) => {
      if (kind !== 'todas' && item.kind !== kind) {
        return false;
      }
      if (view !== 'historial' || cycle === ALL_CYCLES || kind === 'desasignacion') {
        return true;
      }
      return item.kind === 'estacionamiento' && item.cycle === cycle;
    });

    return view === 'historial' ? sortByDate(matching, this.dateOrder()) : matching;
  });

  setKindFilter(event: Event): void {
    this.kindFilter.set((event.target as HTMLSelectElement).value as RequestKind);
  }

  clearFilters(): void {
    this.cycleFilter.set(ALL_CYCLES);
    this.kindFilter.set('todas');
  }

  setDateOrder(event: Event): void {
    this.dateOrder.set((event.target as HTMLSelectElement).value as DateOrder);
  }

  protected readonly filteredOutByCycle = computed(
    () =>
      this.showCycleFilter() &&
      this.selectedCycle() !== ALL_CYCLES &&
      !this.visibleRequests().length,
  );

  private readonly formBuilder = inject(FormBuilder);

  protected readonly resubmitTarget = signal<ParkingRequestInformation | null>(null);
  protected readonly resubmittingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly resubmitForm = this.formBuilder.nonNullable.group({
    observation: ['', Validators.maxLength(500)],
  });

  setCycleFilter(event: Event): void {
    this.cycleFilter.set((event.target as HTMLSelectElement).value);
  }

  askResubmit(request: ParkingRequestInformation): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.resubmitForm.reset();
    this.resubmitTarget.set(request);
  }

  cancelResubmit(): void {
    this.resubmitTarget.set(null);
  }

  confirmResubmit(): void {
    const request = this.resubmitTarget();
    if (!request || this.resubmittingId() !== null || this.resubmitForm.invalid) {
      return;
    }

    const observation = this.resubmitForm.getRawValue().observation.trim();

    this.resubmittingId.set(request.idRequest);
    this.resubmitTarget.set(null);

    this.parkingRequestService
      .resubmit(request.idRequest, observation ? { observation } : undefined)
      .subscribe({
        next: () => {
          this.resubmittingId.set(null);
          this.successMessage.set(
            `La solicitud #${request.idRequest} fue reenviada correctamente.`,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.resubmittingId.set(null);
          this.errorMessage.set(apiErrorMessage(error));
          this.parkingRequestService.reload();
        },
      });
  }

  countFor(view: RequestsView): number {
    return this.items().filter((item) => matchesView(item, view, this.currentCycleName())).length;
  }

  reload(): void {
    this.parkingRequestService.reload();
    this.currentCycleService.reload();
    this.unassignmentService.reload();
  }
}
