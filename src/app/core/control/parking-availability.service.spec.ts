import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { PARKING_AVAILABILITY_PATH } from './control.constants';
import { LocationAvailability, ParkingAvailabilityList } from './models/parking-availability.model';
import { ParkingAvailabilityService, availabilityToneFor } from './parking-availability.service';
import { ParkingControlRealtimeService } from './parking-control-realtime.service';

const AVAILABILITY_URL = `${environment.gatewayUrl}${PARKING_AVAILABILITY_PATH}`;

function location(
  locationId: number,
  locationName: string,
  capacity: number,
  occupied: number,
  campusId: number | null = 1,
): LocationAvailability {
  return {
    locationId,
    locationName,
    campusId,
    campusName: campusId === null ? null : 'Lima Centro',
    capacity,
    occupied,
    available: Math.max(0, capacity - occupied),
  };
}

const AVAILABILITY: ParkingAvailabilityList = {
  availability: [
    location(1, 'Sede Arequipa', 75, 43),
    location(2, 'Sede Petit Thouars', 70, 29),
    location(3, 'Sede Pacífico', 80, 30),
  ],
};

describe('ParkingAvailabilityService', () => {
  let service: ParkingAvailabilityService;
  let httpTesting: HttpTestingController;
  let realtimeChanges: Subject<LocationAvailability>;

  beforeEach(() => {
    realtimeChanges = new Subject<LocationAvailability>();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated: signal(true) } },
        {
          provide: ParkingControlRealtimeService,
          useValue: {
            availabilityChanges: realtimeChanges.asObservable(),
            status: signal('connected'),
          },
        },
      ],
    });

    service = TestBed.inject(ParkingAvailabilityService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  function settle(): Promise<void> {
    TestBed.tick();
    return TestBed.inject(ApplicationRef).whenStable();
  }

  async function loadAvailability(list: ParkingAvailabilityList = AVAILABILITY): Promise<void> {
    TestBed.tick();
    httpTesting.expectOne(AVAILABILITY_URL).flush(list);
    await settle();
  }

  it('obtiene el estado inicial de disponibilidad por REST', () => {
    TestBed.tick();

    const request = httpTesting.expectOne(AVAILABILITY_URL);
    expect(request.request.method).toBe('GET');
    request.flush(AVAILABILITY);
  });

  it('expone la disponibilidad calculada de cada sede', async () => {
    await loadAvailability();

    expect(service.availability().length).toBe(3);
    expect(service.availability()[0].available).toBe(32);
    expect(service.totalAvailable()).toBe(32 + 41 + 50);
  });

  it('agrupa las sedes por campus', async () => {
    await loadAvailability();

    const campuses = service.campuses();
    expect(campuses.length).toBe(1);
    expect(campuses[0].campusName).toBe('Lima Centro');
    expect(campuses[0].locations.length).toBe(3);
    expect(campuses[0].capacity).toBe(225);
    expect(campuses[0].available).toBe(123);
  });

  it('actualiza solo la sede afectada cuando llega un evento en tiempo real', async () => {
    await loadAvailability();

    service.realtimeUpdates().subscribe();
    realtimeChanges.next(location(1, 'Sede Arequipa', 75, 44));
    await settle();

    expect(service.availability()[0].occupied).toBe(44);
    expect(service.availability()[0].available).toBe(31);
    expect(service.availability()[1].occupied).toBe(29);
    expect(service.availability()[2].occupied).toBe(30);
  });

  it('aplica la disponibilidad devuelta por un movimiento registrado', async () => {
    await loadAvailability();

    service.applyAvailability(location(2, 'Sede Petit Thouars', 70, 30));
    await settle();

    expect(service.availability()[1].available).toBe(40);
  });

  it('ignora una disponibilidad nula', async () => {
    await loadAvailability();

    service.applyAvailability(null);
    await settle();

    expect(service.availability()[0].available).toBe(32);
  });

  it('busca la disponibilidad de una sede por su identificador', async () => {
    await loadAvailability();

    expect(service.locationById(3)?.locationName).toBe('Sede Pacífico');
    expect(service.locationById(99)).toBeUndefined();
  });
});

describe('availabilityToneFor', () => {
  it('marca como completo una sede sin espacios', () => {
    expect(availabilityToneFor(location(1, 'Sede Arequipa', 75, 75))).toBe('full');
  });

  it('marca como baja disponibilidad menos del 15% libre', () => {
    expect(availabilityToneFor(location(1, 'Sede Arequipa', 100, 90))).toBe('low');
  });

  it('marca como disponibilidad media entre 15% y 40% libre', () => {
    expect(availabilityToneFor(location(1, 'Sede Arequipa', 100, 70))).toBe('medium');
  });

  it('marca como alta disponibilidad más del 40% libre', () => {
    expect(availabilityToneFor(location(1, 'Sede Arequipa', 100, 20))).toBe('free');
  });
});
