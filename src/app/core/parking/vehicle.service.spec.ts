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
      status: 'ASSIGNED',
    },
    {
      idVehicle: 2,
      numberPlate: 'XYZ-456',
      idVehicleType: 1,
      vehicleType: 'Automóvil',
      status: 'ASSIGNED',
    },
  ],
  assignedVehicles: 2,
  maxAssignedVehicles: 5,
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

  it('expone los vehículos con su contador de asignados y el máximo', async () => {
    await loadVehicles();

    expect(service.vehicles().length).toBe(2);
    expect(service.assignedVehicleCount()).toBe(2);
    expect(service.maxAssignedVehicles()).toBe(5);
    expect(service.hasReachedLimit()).toBe(false);
  });

  it('solo expone vehículos asignados', async () => {
    await loadVehicles();

    expect(service.vehicles().every((vehicle) => vehicle.status === 'ASSIGNED')).toBe(true);
  });

  it('marca el límite alcanzado cuando los asignados igualan al máximo', async () => {
    await loadVehicles({ ...VEHICLE_LIST, assignedVehicles: 5, maxAssignedVehicles: 5 });

    expect(service.hasReachedLimit()).toBe(true);
  });

  it('los vehículos desasignados no cuentan para el límite', async () => {
    await loadVehicles({ ...VEHICLE_LIST, assignedVehicles: 4, maxAssignedVehicles: 5 });

    expect(service.assignedVehicleCount()).toBe(4);
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

  it('no expone ninguna operación de disponibilidad del vehículo', () => {
    expect('setAvailability' in service).toBe(false);
  });
});
