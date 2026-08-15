import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { VehicleDetailList } from './models/vehicle.model';
import { PARKING_VEHICLE_PATH } from './parking.constants';
import { VehicleService } from './vehicle.service';

const VEHICLES_URL = `${environment.gatewayUrl}${PARKING_VEHICLE_PATH}`;

const VEHICLE_LIST: VehicleDetailList = {
  vehicles: [
    {
      idVehicle: 1,
      numberPlate: 'ABC-123',
      idVehicleType: 1,
      vehicleType: 'Automóvil',
      status: 'ACTIVE',
    },
    {
      idVehicle: 2,
      numberPlate: 'XYZ-456',
      idVehicleType: 1,
      vehicleType: 'Automóvil',
      status: 'DISABLED',
    },
  ],
  assignedVehicles: 2,
  activeVehicles: 1,
  maxActiveVehicles: 5,
};

describe('VehicleService', () => {
  let service: VehicleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated: signal(true) } },
      ],
    });

    service = TestBed.inject(VehicleService);
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

  async function nextTurn(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
  }

  async function loadVehicles(list: VehicleDetailList = VEHICLE_LIST): Promise<void> {
    TestBed.tick();
    httpTesting.expectOne(`${VEHICLES_URL}/me`).flush(list);
    await settle();
  }

  it('consulta los vehículos del usuario autenticado sin enviar su id', () => {
    TestBed.tick();

    const request = httpTesting.expectOne(`${VEHICLES_URL}/me`);
    expect(request.request.method).toBe('GET');
    request.flush(VEHICLE_LIST);
  });

  it('expone los vehículos con su contador de activos y el máximo', async () => {
    await loadVehicles();

    expect(service.vehicles().length).toBe(2);
    expect(service.assignedVehicles()).toBe(2);
    expect(service.activeVehicleCount()).toBe(1);
    expect(service.maxActiveVehicles()).toBe(5);
    expect(service.hasReachedLimit()).toBe(false);
  });

  it('separa los vehículos activos de los deshabilitados', async () => {
    await loadVehicles();

    expect(service.activeVehicles().map((vehicle) => vehicle.numberPlate)).toEqual(['ABC-123']);
  });

  it('marca el límite alcanzado cuando los activos igualan al máximo', async () => {
    await loadVehicles({ ...VEHICLE_LIST, activeVehicles: 5, maxActiveVehicles: 5 });

    expect(service.hasReachedLimit()).toBe(true);
  });

  it('no cuenta los vehículos deshabilitados para el límite de activos', async () => {
    await loadVehicles({ ...VEHICLE_LIST, assignedVehicles: 8, activeVehicles: 4 });

    expect(service.activeVehicleCount()).toBe(4);
    expect(service.hasReachedLimit()).toBe(false);
  });

  it('registra un vehículo con el tipo y la placa', async () => {
    await loadVehicles();

    service.register({ numberPlate: 'DEF-789', vehicleType: 1 }).subscribe();

    const request = httpTesting.expectOne(VEHICLES_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ numberPlate: 'DEF-789', vehicleType: 1 });
    request.flush(VEHICLE_LIST.vehicles[0]);

    await nextTurn();
    httpTesting.expectOne(`${VEHICLES_URL}/me`).flush(VEHICLE_LIST);
  });

  it('deshabilita un vehículo con PATCH sobre su identificador', async () => {
    await loadVehicles();

    service.setAvailability(1, false).subscribe();

    const request = httpTesting.expectOne(`${VEHICLES_URL}/1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ active: false });
    request.flush({ ...VEHICLE_LIST.vehicles[0], active: false });

    await nextTurn();
    httpTesting.expectOne(`${VEHICLES_URL}/me`).flush(VEHICLE_LIST);
  });

  it('habilita un vehículo con PATCH sobre su identificador', async () => {
    await loadVehicles();

    service.setAvailability(2, true).subscribe();

    const request = httpTesting.expectOne(`${VEHICLES_URL}/2`);
    expect(request.request.body).toEqual({ active: true });
    request.flush({ ...VEHICLE_LIST.vehicles[1], active: true });

    await nextTurn();
    httpTesting.expectOne(`${VEHICLES_URL}/me`).flush(VEHICLE_LIST);
  });
});
