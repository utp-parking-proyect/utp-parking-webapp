import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
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
  let acceptorRequests: WritableSignal<VehicleUnassignmentRequestDetail[]>;
  let isLoading: WritableSignal<boolean>;
  let respond: ReturnType<typeof vi.fn>;

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

  function buildReview(id = '7'): void {
    fixture = TestBed.createComponent(UnassignmentDetailPage);
    fixture.componentRef.setInput('unassignmentId', id);
    fixture.componentRef.setInput('mode', 'review');
    fixture.detectChanges();
  }

  beforeEach(() => {
    myRequests = signal([unassignment('RECHAZADO', 'El vehículo tiene una multa pendiente.')]);
    acceptorRequests = signal([unassignment('EN_REVISION', 'Asignada a Personal SAE.')]);
    isLoading = signal(false);
    respond = vi.fn(() => of(unassignment('APROBADO', 'Desasignación aprobada.')));

    TestBed.configureTestingModule({
      imports: [UnassignmentDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: VehicleUnassignmentService,
          useValue: {
            myRequests,
            acceptorRequests,
            isLoading,
            hasFailed: signal(false),
            acceptorIsLoading: signal(false),
            acceptorHasFailed: signal(false),
            respond,
            reload: () => undefined,
            reloadAcceptor: () => undefined,
          },
        },
        {
          provide: ParkingReviewService,
          useValue: {
            applicantProfile: signal({
              dni: '70123456',
              institutionalEmail: 'u23201703@utp.edu.pe',
              career: 'Ingeniería de Sistemas',
              campus: { idCampus: 1, nameCampus: 'Campus Central' },
            }),
            applicantFailed: signal(false),
            selectApplicant: () => undefined,
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

  it('no ofrece acciones de revisión al solicitante', () => {
    build();

    expect(host().querySelector('.actions')).toBeNull();
    expect(text()).not.toContain('Solicitante');
  });

  it('en modo revisión lee la bandeja del aceptante', () => {
    buildReview();

    expect(text()).toContain('Desasignación #7');
    expect(text()).toContain('Revisa la información del solicitante');
  });

  it('en modo revisión muestra los datos del solicitante', () => {
    buildReview();

    expect(text()).toContain('Juan Pérez');
    expect(text()).toContain('U23201703');
    expect(text()).toContain('70123456');
    expect(text()).toContain('Campus Central');
  });

  it('en modo revisión ofrece aceptar y rechazar', () => {
    buildReview();

    expect(text()).toContain('Aceptar desasignación');
    expect(text()).toContain('Rechazar desasignación');
  });

  it('pide confirmación antes de aceptar', () => {
    buildReview();

    const accept = [...host().querySelectorAll<HTMLButtonElement>('.actions button')][0];
    accept.click();
    fixture.detectChanges();

    expect(text()).toContain('¿Aceptar la desasignación?');
    expect(respond).not.toHaveBeenCalled();
  });

  it('acepta la desasignación al confirmar', () => {
    buildReview();

    [...host().querySelectorAll<HTMLButtonElement>('.actions button')][0].click();
    fixture.detectChanges();

    const dialogButtons = [
      ...host().querySelectorAll<HTMLButtonElement>('.ui-dialog__actions button'),
    ];
    dialogButtons[dialogButtons.length - 1].click();
    fixture.detectChanges();

    expect(respond).toHaveBeenCalledWith(7, { approved: true });
  });

  it('exige motivo para rechazar', () => {
    buildReview();

    [...host().querySelectorAll<HTMLButtonElement>('.actions button')][1].click();
    fixture.detectChanges();

    const dialogButtons = [
      ...host().querySelectorAll<HTMLButtonElement>('.ui-dialog__actions button'),
    ];
    dialogButtons[dialogButtons.length - 1].click();
    fixture.detectChanges();

    expect(respond).not.toHaveBeenCalled();
    expect(text()).toContain('Indica el motivo del rechazo.');
  });

  it('no permite responder una solicitud ya revisada', () => {
    acceptorRequests.set([unassignment('APROBADO', 'Desasignación aprobada.')]);
    buildReview();

    expect(host().querySelector('.actions')).toBeNull();
    expect(text()).toContain('ya fue respondida y no admite cambios');
  });
});
