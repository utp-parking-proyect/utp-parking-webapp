import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { MyRequestsPage } from './my-requests-page';

function parking(
  idRequest: number,
  numberPlate: string,
  numberCycle: string,
  status: string,
  dateResponse: string | null = null,
): ParkingRequestInformation {
  return {
    idRequest,
    applicant: {
      idApplicant: 1,
      nameApplicant: 'Juan',
      lastNameApplicant: 'Pérez',
      usernameApplicant: 'U23201703',
      numberCycle,
    },
    vehicle: { numberPlate, vehicleType: 'Automóvil' },
    dateRequest: '2026-03-01T10:00:00Z',
    dateResponse,
    status,
  };
}

function unassignment(
  idUnassignmentRequest: number,
  status: string,
  dateResponse: string | null = null,
): VehicleUnassignmentRequestDetail {
  return {
    idUnassignmentRequest,
    idVehicle: 5,
    applicant: {
      idApplicant: 1,
      nameApplicant: 'Juan',
      lastNameApplicant: 'Pérez',
      usernameApplicant: 'U23201703',
      numberCycle: '2026-1',
    },
    vehicle: { numberPlate: 'XYZ-456', vehicleType: 'Automóvil' },
    reason: 'Vendí el vehículo.',
    status,
    dateRequest: '2026-03-02T10:00:00Z',
    dateResponse,
    workflow: [
      { status, dateStatusChange: '2026-03-02T10:00:00Z', observation: 'Sin observaciones.' },
    ],
  };
}

describe('MyRequestsPage', () => {
  let fixture: ComponentFixture<MyRequestsPage>;
  let requests: WritableSignal<ParkingRequestInformation[]>;
  let unassignments: WritableSignal<VehicleUnassignmentRequestDetail[]>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function parkingCards(): HTMLElement[] {
    return Array.from(host().querySelectorAll<HTMLElement>('app-request-card'));
  }

  function unassignmentCards(): HTMLElement[] {
    return Array.from(host().querySelectorAll<HTMLElement>('app-unassignment-request-card'));
  }

  function selectKind(value: string): void {
    const select = host().querySelector<HTMLSelectElement>('#kind-filter')!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    requests = signal([parking(1, 'ABC-123', '2026-1', 'EN_REVISION')]);
    unassignments = signal([unassignment(7, 'EN_REVISION')]);

    TestBed.configureTestingModule({
      imports: [MyRequestsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ParkingRequestService,
          useValue: {
            requests,
            isLoading: signal(false),
            hasFailed: signal(false),
            maxRequestsPerCycle: 2,
            hasReachedCycleLimit: signal(false),
            currentCycleRequests: signal([]),
            resubmit: () => of({ parkingRequestId: 1 }),
            reload: () => undefined,
          },
        },
        {
          provide: VehicleUnassignmentService,
          useValue: {
            myRequests: unassignments,
            isLoading: signal(false),
            hasFailed: signal(false),
            reload: () => undefined,
          },
        },
        {
          provide: CurrentCycleService,
          useValue: {
            name: signal('2026-1'),
            isLoading: signal(false),
            hasFailed: signal(false),
            reload: () => undefined,
          },
        },
      ],
    });

    fixture = TestBed.createComponent(MyRequestsPage);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('lista las solicitudes de estacionamiento y las de desasignación juntas', () => {
    expect(parkingCards().length).toBe(1);
    expect(unassignmentCards().length).toBe(1);
  });

  it('ofrece un filtro por tipo de solicitud', () => {
    expect(host().querySelector('#kind-filter')).not.toBeNull();
    expect(text()).toContain('Ingreso a estacionamiento');
    expect(text()).toContain('Desasignación de vehículo');
  });

  it('muestra solo las solicitudes de estacionamiento al filtrar por ese tipo', () => {
    selectKind('estacionamiento');

    expect(parkingCards().length).toBe(1);
    expect(unassignmentCards().length).toBe(0);
  });

  it('muestra solo las desasignaciones al filtrar por ese tipo', () => {
    selectKind('desasignacion');

    expect(parkingCards().length).toBe(0);
    expect(unassignmentCards().length).toBe(1);
  });

  it('cuenta ambos tipos de solicitud en el contador de la vista', () => {
    expect(text()).toContain('2 de 2 solicitudes');
  });

  it('excluye las desasignaciones respondidas de la vista en curso', () => {
    unassignments.set([unassignment(7, 'APROBADO', '2026-03-03T10:00:00Z')]);
    fixture.componentRef.setInput('vista', 'en-curso');
    fixture.detectChanges();

    expect(unassignmentCards().length).toBe(0);
  });

  it('mantiene las desasignaciones en curso en la vista en curso', () => {
    fixture.componentRef.setInput('vista', 'en-curso');
    fixture.detectChanges();

    expect(unassignmentCards().length).toBe(1);
  });

  it('enlaza cada desasignación con su propio detalle', () => {
    const link = unassignmentCards()[0].querySelector<HTMLAnchorElement>('a')!;

    expect(link.getAttribute('href')).toBe('/solicitudes/desasignacion/7');
    expect(link.textContent).toContain('Ver detalle');
  });

  it('mantiene visibles las desasignaciones aunque haya un ciclo seleccionado', () => {
    fixture.componentRef.setInput('vista', 'historial');
    fixture.detectChanges();

    const cycleSelect = host().querySelector<HTMLSelectElement>('#cycle-filter')!;
    cycleSelect.value = '2026-1';
    cycleSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(unassignmentCards().length).toBe(0);

    selectKind('desasignacion');

    expect(unassignmentCards().length).toBe(1);
    expect(host().querySelector('#cycle-filter')).toBeNull();
  });

  it('presenta las fechas con el mismo formato que las de estacionamiento', () => {
    const longDate = /\d{2} \w{3}\.? \d{4}/;
    const numericDate = /\d{2}\/\d{2}\/\d{4}/;

    const parkingText = parkingCards()[0].textContent ?? '';
    const unassignmentText = unassignmentCards()[0].textContent ?? '';

    expect(parkingText).toMatch(longDate);
    expect(unassignmentText).toMatch(longDate);
    expect(unassignmentText).not.toMatch(numericDate);
  });

  it('usa las mismas etiquetas de la tarjeta de estacionamiento', () => {
    const card = unassignmentCards()[0];

    expect(card.textContent).toContain('Fecha de solicitud');
    expect(card.textContent).toContain('Fecha de respuesta');
    expect(card.textContent).toContain('N.° de solicitud');
    expect(card.textContent).toContain('Motivo');
  });
});
