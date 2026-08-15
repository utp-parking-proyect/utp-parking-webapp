import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VehicleDetail } from '../../../../core/parking/models/vehicle.model';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { VehicleService } from '../../../../core/parking/vehicle.service';
import { NewRequestPage } from './new-request-page';

function vehicle(idVehicle: number, numberPlate: string, active: boolean): VehicleDetail {
  return {
    idVehicle,
    numberPlate,
    idVehicleType: 1,
    vehicleType: 'Automóvil',
    status: active ? 'ACTIVE' : 'DISABLED',
  };
}

describe('NewRequestPage vehicle selection', () => {
  let fixture: ComponentFixture<NewRequestPage>;
  let vehicles: WritableSignal<VehicleDetail[]>;
  let hasReachedCycleLimit: WritableSignal<boolean>;
  let currentCycleRequests: WritableSignal<unknown[]>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function options(): HTMLElement[] {
    return Array.from(host().querySelectorAll<HTMLElement>('.picker__option'));
  }

  function radios(): HTMLInputElement[] {
    return Array.from(host().querySelectorAll<HTMLInputElement>('.picker__input'));
  }

  function build(activeVehicles: VehicleDetail[]): void {
    TestBed.configureTestingModule({
      imports: [NewRequestPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ParkingRequestService,
          useValue: {
            requests: signal([]),
            isLoading: signal(false),
            hasFailed: signal(false),
            maxRequestsPerCycle: 2,
            currentCycleRequests,
            hasReachedCycleLimit,
            create: () => ({ subscribe: () => undefined }),
            reload: () => undefined,
          },
        },
        {
          provide: VehicleService,
          useValue: {
            vehicles,
            activeVehicles: signal(activeVehicles),
            activeVehicleCount: signal(activeVehicles.length),
            maxActiveVehicles: signal(5),
            hasReachedLimit: signal(false),
            isLoading: signal(false),
            hasFailed: signal(false),
            reload: () => undefined,
          },
        },
      ],
    });

    fixture = TestBed.createComponent(NewRequestPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    vehicles = signal<VehicleDetail[]>([vehicle(1, 'ABC-123', true), vehicle(2, 'XYZ-456', false)]);
    hasReachedCycleLimit = signal(false);
    currentCycleRequests = signal([]);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra los vehículos deshabilitados pero no permite seleccionarlos', () => {
    build([vehicles()[0]]);

    expect(options().length).toBe(2);
    expect(radios().length).toBe(1);
    expect(options()[1].textContent).toContain('XYZ-456');
    expect(options()[1].textContent).toContain('Vehículo deshabilitado');
    expect(options()[1].classList).toContain('picker__option--disabled');
  });

  it('preselecciona el primer vehículo activo', () => {
    build([vehicles()[0]]);

    expect(radios()[0].checked).toBe(true);
  });

  it('muestra el contador de solicitudes del ciclo', () => {
    currentCycleRequests.set([{}]);
    build([vehicles()[0]]);

    expect(text()).toContain('Has realizado 1 de 2 solicitudes para este ciclo');
  });

  it('bloquea el registro cuando se alcanzó el límite de solicitudes del ciclo', () => {
    currentCycleRequests.set([{}, {}]);
    hasReachedCycleLimit.set(true);
    build([vehicles()[0]]);

    expect(text()).toContain('Has alcanzado el máximo de 2 solicitudes permitidas para este ciclo');
    expect(options().length).toBe(0);
  });

  it('pide habilitar un vehículo cuando todos están deshabilitados', () => {
    vehicles.set([vehicle(2, 'XYZ-456', false)]);
    build([]);

    expect(text()).toContain('No tienes vehículos disponibles');
  });
});
