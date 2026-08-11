import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { RequestCard } from '../../components/request-card/request-card';

type RequestsView = 'todas' | 'en-curso' | 'historial';

interface ViewOption {
  value: RequestsView;
  label: string;
}

const VIEWS: ViewOption[] = [
  { value: 'todas', label: 'Ciclo actual' },
  { value: 'en-curso', label: 'En curso' },
  { value: 'historial', label: 'Historial' },
];

/** Valor centinela del combo de ciclos: no filtrar. Vacío para que nunca choque con un ciclo real. */
const ALL_CYCLES = '';

function cycleOf(request: ParkingRequestInformation): string {
  return request.Applicant.numberCycle?.trim() ?? '';
}

function isFromCycle(request: ParkingRequestInformation, cycleName: string | null): boolean {
  // Sin ciclo vigente resuelto preferimos mostrar de más antes que dejar la vista vacía.
  return cycleName === null || cycleOf(request) === cycleName;
}

function matchesView(
  request: ParkingRequestInformation,
  view: RequestsView,
  cycleName: string | null,
): boolean {
  switch (view) {
    case 'en-curso':
      return !request.dateResponse && isFromCycle(request, cycleName);
    case 'historial':
      return true;
    default:
      return isFromCycle(request, cycleName);
  }
}

@Component({
  selector: 'app-my-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RequestCard, UiAlert, UiButton, UiCard, UiFormField, UiIcon],
  templateUrl: './my-requests-page.html',
  styleUrl: './my-requests-page.scss',
})
export class MyRequestsPage {
  private readonly parkingRequestService = inject(ParkingRequestService);
  private readonly currentCycleService = inject(CurrentCycleService);

  readonly vista = input<string>();

  protected readonly views = VIEWS;
  protected readonly requests = this.parkingRequestService.requests;
  protected readonly currentCycleName = this.currentCycleService.name;
  protected readonly isLoading = computed(
    () => this.parkingRequestService.isLoading() || this.currentCycleService.isLoading(),
  );
  protected readonly hasFailed = this.parkingRequestService.hasFailed;

  protected readonly view = computed<RequestsView>(() => {
    const requested = this.vista();
    return VIEWS.some((option) => option.value === requested)
      ? (requested as RequestsView)
      : 'todas';
  });

  protected readonly allCycles = ALL_CYCLES;

  /**
   * Ciclos con al menos una solicitud, en el orden en que aparecen: `requests` ya viene ordenado
   * del más reciente al más antiguo, así que no hace falta suponer un formato de nombre.
   */
  protected readonly cycles = computed(() => [
    ...new Set(this.requests().map(cycleOf).filter(Boolean)),
  ]);

  private readonly cycleFilter = signal(ALL_CYCLES);

  /** Si el ciclo elegido desaparece tras recargar, volvemos a "todos" en vez de mostrar vacío. */
  protected readonly selectedCycle = computed(() => {
    const selected = this.cycleFilter();
    return this.cycles().includes(selected) ? selected : ALL_CYCLES;
  });

  protected readonly visibleRequests = computed(() => {
    const view = this.view();
    const cycle = this.selectedCycle();
    return this.requests().filter((request) => {
      if (!matchesView(request, view, this.currentCycleName())) {
        return false;
      }
      // El filtro por ciclo solo existe en el historial; las otras vistas ya están acotadas.
      return view !== 'historial' || cycle === ALL_CYCLES || cycleOf(request) === cycle;
    });
  });

  /** Hay historial, pero el ciclo elegido lo dejó vacío: es un filtro, no una ausencia de datos. */
  protected readonly filteredOutByCycle = computed(
    () =>
      this.view() === 'historial' &&
      this.selectedCycle() !== ALL_CYCLES &&
      !this.visibleRequests().length,
  );

  setCycleFilter(event: Event): void {
    this.cycleFilter.set((event.target as HTMLSelectElement).value);
  }

  countFor(view: RequestsView): number {
    return this.requests().filter((request) =>
      matchesView(request, view, this.currentCycleName()),
    ).length;
  }

  reload(): void {
    this.parkingRequestService.reload();
    this.currentCycleService.reload();
  }
}
