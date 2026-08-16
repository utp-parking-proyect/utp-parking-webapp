import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AccessControlService } from './access-control.service';
import { PARKING_ENTRY_PATH, PARKING_EXIT_PATH } from './control.constants';
import { AccessControlOut } from './models/access-control.model';
import { LocationAvailability } from './models/parking-availability.model';
import { ParkingAvailabilityService } from './parking-availability.service';

const ENTRY_URL = `${environment.gatewayUrl}${PARKING_ENTRY_PATH}`;
const EXIT_URL = `${environment.gatewayUrl}${PARKING_EXIT_PATH}`;

const AVAILABILITY: LocationAvailability = {
  locationId: 1,
  locationName: 'Sede Arequipa',
  campusId: 1,
  campusName: 'Lima Centro',
  capacity: 75,
  occupied: 43,
  available: 32,
};

const ENTRY_RESULT: AccessControlOut = {
  authorized: true,
  result: 'ENTRY_REGISTERED',
  message: 'Ingreso autorizado',
  vehicle: { numberPlate: 'ABC-123', vehicleType: 'Automóvil' },
  applicant: null,
  location: {
    idLocation: 1,
    nameLocation: 'Sede Arequipa',
    address: 'Av. Arequipa 265 - 279',
    campusName: 'Lima Centro',
  },
  availability: AVAILABILITY,
  record: { idRecord: 1, entryDate: '2026-08-15T08:30:00', departureDate: null },
};

describe('AccessControlService', () => {
  let service: AccessControlService;
  let httpTesting: HttpTestingController;
  let applied: (LocationAvailability | null)[];

  beforeEach(() => {
    applied = [];

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ParkingAvailabilityService,
          useValue: {
            applyAvailability: (availability: LocationAvailability | null) =>
              applied.push(availability),
          },
        },
      ],
    });

    service = TestBed.inject(AccessControlService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('registra el ingreso con la placa y la sede', () => {
    service.registerEntry({ numberPlate: 'ABC-123', locationId: 1 }).subscribe();

    const request = httpTesting.expectOne(ENTRY_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ numberPlate: 'ABC-123', locationId: 1 });
    request.flush(ENTRY_RESULT);
  });

  it('aplica la disponibilidad devuelta tras un ingreso registrado', () => {
    service.registerEntry({ numberPlate: 'ABC-123', locationId: 1 }).subscribe();
    httpTesting.expectOne(ENTRY_URL).flush(ENTRY_RESULT);

    expect(applied).toEqual([AVAILABILITY]);
  });

  it('registra la salida con la placa y la sede', () => {
    service.registerExit({ numberPlate: 'ABC-123', locationId: 1 }).subscribe();

    const request = httpTesting.expectOne(EXIT_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ numberPlate: 'ABC-123', locationId: 1 });
    request.flush({
      ...ENTRY_RESULT,
      result: 'EXIT_REGISTERED',
      message: 'Salida registrada',
      availability: { ...AVAILABILITY, occupied: 42, available: 33 },
      record: {
        idRecord: 1,
        entryDate: '2026-08-15T08:30:00',
        departureDate: '2026-08-15T18:05:00',
      },
    });

    expect(applied[0]?.available).toBe(33);
  });

  it('expone el resultado de negocio cuando el movimiento es rechazado', () => {
    let result: AccessControlOut | undefined;
    service.registerEntry({ numberPlate: 'ZZZ-999', locationId: 1 }).subscribe((response) => {
      result = response;
    });

    httpTesting.expectOne(ENTRY_URL).flush({
      ...ENTRY_RESULT,
      authorized: false,
      result: 'PARKING_FULL',
      message: 'El estacionamiento de la sede no tiene espacios disponibles',
      record: null,
    });

    expect(result?.authorized).toBe(false);
    expect(result?.result).toBe('PARKING_FULL');
  });
});
