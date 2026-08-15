import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { UnassignmentDetailPage } from './unassignment-detail-page';

function unassignment(status: string, observation: string): VehicleUnassignmentRequestDetail {
  return {
    idUnassignmentRequest: 7,
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
    dateResponse: status === 'EN_REVISION' ? null : '2026-03-04T10:00:00Z',
    workflow: [
      {
        status: 'REGISTRADO',
        dateStatusChange: '2026-03-02T10:00:00Z',
        observation: 'Solicitud de desasignación registrada.',
      },
      { status, dateStatusChange: '2026-03-04T10:00:00Z', observation },
    ],
  };
}

describe('UnassignmentDetailPage', () => {
  let fixture: ComponentFixture<UnassignmentDetailPage>;
  let myRequests: WritableSignal<VehicleUnassignmentRequestDetail[]>;
  let isLoading: WritableSignal<boolean>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function build(id = '7'): void {
    fixture = TestBed.createComponent(UnassignmentDetailPage);
    fixture.componentRef.setInput('unassignmentId', id);
    fixture.detectChanges();
  }

  beforeEach(() => {
    myRequests = signal([unassignment('RECHAZADO', 'El vehículo tiene una multa pendiente.')]);
    isLoading = signal(false);

    TestBed.configureTestingModule({
      imports: [UnassignmentDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: VehicleUnassignmentService,
          useValue: {
            myRequests,
            isLoading,
            hasFailed: signal(false),
            reload: () => undefined,
          },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra el detalle de la solicitud de desasignación', () => {
    build();

    expect(text()).toContain('Desasignación #7');
    expect(text()).toContain('XYZ-456');
    expect(text()).toContain('Vendí el vehículo.');
  });

  it('muestra el historial de la solicitud', () => {
    build();

    expect(host().querySelector('app-request-timeline')).not.toBeNull();
    expect(text()).toContain('Solicitud de desasignación registrada.');
  });

  it('destaca el motivo del rechazo', () => {
    build();

    expect(text()).toContain('Motivo del rechazo');
    expect(text()).toContain('El vehículo tiene una multa pendiente.');
    expect(host().querySelector('.decision--rejected')).not.toBeNull();
  });

  it('no muestra bloque de decisión mientras está en revisión', () => {
    myRequests.set([unassignment('EN_REVISION', 'Solicitud asignada a Personal SAE.')]);
    build();

    expect(host().querySelector('.decision')).toBeNull();
    expect(text()).toContain('Pendiente');
  });

  it('avisa cuando la solicitud no existe', () => {
    build('999');

    expect(text()).toContain('No encontramos esta solicitud');
  });

  it('muestra el estado de carga mientras consulta', () => {
    isLoading.set(true);
    build();

    expect(text()).toContain('Cargando la solicitud');
  });
});
