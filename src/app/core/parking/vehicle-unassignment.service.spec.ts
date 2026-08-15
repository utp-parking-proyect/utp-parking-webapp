import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { CurrentUserService } from '../portal/current-user.service';
import {
  VehicleUnassignmentRequestDetail,
  VehicleUnassignmentRequestList,
} from './models/vehicle.model';
import { PARKING_VEHICLE_PATH } from './parking.constants';
import { VehicleUnassignmentService } from './vehicle-unassignment.service';

const VEHICLES_URL = `${environment.gatewayUrl}${PARKING_VEHICLE_PATH}`;
const UNASSIGNMENTS_URL = `${VEHICLES_URL}/unassignment-requests`;

function unassignment(
  idUnassignmentRequest: number,
  idVehicle: number,
  status: string,
): VehicleUnassignmentRequestDetail {
  return {
    idUnassignmentRequest,
    idVehicle,
    applicant: {
      idApplicant: 1,
      nameApplicant: 'Juan',
      lastNameApplicant: 'Pérez',
      usernameApplicant: 'U23201703',
      numberCycle: '2026-1',
    },
    vehicle: { numberPlate: 'ABC-123', vehicleType: 'Automóvil' },
    reason: 'Vendí el vehículo.',
    status,
    dateRequest: '2026-03-01T10:00:00Z',
    dateResponse: null,
    workflow: [],
  };
}

function configure(roles: string[]): VehicleUnassignmentService {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { roles: signal(roles) } },
      {
        provide: CurrentUserService,
        useValue: { userId: signal(20), isLoading: signal(false), hasFailed: signal(false) },
      },
    ],
  });

  return TestBed.inject(VehicleUnassignmentService);
}

describe('VehicleUnassignmentService', () => {
  let httpTesting: HttpTestingController;

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  function settle(): Promise<void> {
    TestBed.tick();
    return TestBed.inject(ApplicationRef).whenStable();
  }

  it('consulta las solicitudes del usuario autenticado sin enviar su id', () => {
    const service = configure(['ROLE_STUDENT']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();

    const request = httpTesting.expectOne(`${UNASSIGNMENTS_URL}/me`);
    expect(request.request.method).toBe('GET');
    expect(service).toBeTruthy();
    request.flush({ unassignmentRequests: [] } satisfies VehicleUnassignmentRequestList);
  });

  it('no consulta las solicitudes del aceptante cuando el usuario no es SAE', () => {
    configure(['ROLE_STUDENT']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();

    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/me`).flush({ unassignmentRequests: [] });
    httpTesting.expectNone(`${UNASSIGNMENTS_URL}/acceptor/20`);
  });

  it('consulta las solicitudes asignadas cuando el usuario es SAE', () => {
    configure(['ROLE_SAE']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();

    const request = httpTesting.expectOne(`${UNASSIGNMENTS_URL}/acceptor/20`);
    expect(request.request.method).toBe('GET');
    request.flush({ unassignmentRequests: [] });
    httpTesting.expectNone(`${UNASSIGNMENTS_URL}/me`);
  });

  it('separa las solicitudes pendientes de las revisadas del aceptante', async () => {
    const service = configure(['ROLE_SAE']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();

    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/acceptor/20`).flush({
      unassignmentRequests: [
        unassignment(1, 10, 'EN_REVISION'),
        unassignment(2, 11, 'APROBADO'),
        unassignment(3, 12, 'RECHAZADO'),
      ],
    });
    await settle();

    expect(service.pendingAcceptorRequests().map((item) => item.idUnassignmentRequest)).toEqual([
      1,
    ]);
    expect(service.reviewedAcceptorRequests().map((item) => item.idUnassignmentRequest)).toEqual([
      3, 2,
    ]);
  });

  it('expone la última solicitud por vehículo', async () => {
    const service = configure(['ROLE_STUDENT']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();

    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/me`).flush({
      unassignmentRequests: [unassignment(1, 10, 'RECHAZADO'), unassignment(4, 10, 'EN_REVISION')],
    });
    await settle();

    expect(service.latestByVehicle().get(10)?.idUnassignmentRequest).toBe(4);
  });

  it('registra la solicitud de desasignación sobre el vehículo indicado', async () => {
    const service = configure(['ROLE_STUDENT']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();
    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/me`).flush({ unassignmentRequests: [] });
    await settle();

    service.requestUnassignment(7, { reason: 'Vendí el vehículo.' }).subscribe();

    const request = httpTesting.expectOne(`${VEHICLES_URL}/7/unassignment-requests`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ reason: 'Vendí el vehículo.' });
    request.flush(unassignment(1, 7, 'EN_REVISION'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/me`).flush({ unassignmentRequests: [] });
  });

  it('responde la solicitud de desasignación con PATCH sobre su identificador', async () => {
    const service = configure(['ROLE_SAE']);
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.tick();
    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/acceptor/20`).flush({ unassignmentRequests: [] });
    await settle();

    service.respond(9, { approved: false, comment: 'No procede.' }).subscribe();

    const request = httpTesting.expectOne(`${UNASSIGNMENTS_URL}/9`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ approved: false, comment: 'No procede.' });
    request.flush(unassignment(9, 7, 'RECHAZADO'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
    httpTesting.expectOne(`${UNASSIGNMENTS_URL}/acceptor/20`).flush({ unassignmentRequests: [] });
  });
});
