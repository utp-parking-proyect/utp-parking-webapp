import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { VehicleDetail } from '../../../../core/parking/models/vehicle.model';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { VehicleService } from '../../../../core/parking/vehicle.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { MyVehiclesPage } from './my-vehicles-page';

function vehicle(idVehicle: number, numberPlate: string, active: boolean): VehicleDetail {
  return { idVehicle, numberPlate, idVehicleType: 1, vehicleType: 'Automóvil', active };
}

function request(
  idRequest: number,
  numberPlate: string,
  numberCycle: string,
  status: string,
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
    dateResponse: null,
    status,
  };
}

describe('MyVehiclesPage', () => {
  let fixture: ComponentFixture<MyVehiclesPage>;
  let vehicles: WritableSignal<VehicleDetail[]>;
  let registeredVehicles: WritableSignal<number>;
  let hasReachedLimit: WritableSignal<boolean>;
  let isLoading: WritableSignal<boolean>;
  let hasFailed: WritableSignal<boolean>;
  let requests: WritableSignal<ParkingRequestInformation[]>;
  let requestsFailed: WritableSignal<boolean>;
  let cycleName: WritableSignal<string | null>;
  let setAvailability: ReturnType<typeof vi.fn>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function cards(): HTMLElement[] {
    return Array.from(host().querySelectorAll<HTMLElement>('.vehicle'));
  }

  function addVehicleButton(): HTMLButtonElement {
    return host().querySelector<HTMLButtonElement>('.page-header button')!;
  }

  function clickAvailability(index: number): void {
    cards()[index].querySelector<HTMLButtonElement>('.vehicle__actions button')!.click();
    fixture.detectChanges();
  }

  function dialogConfirm(): HTMLButtonElement {
    const buttons = Array.from(
      host().querySelectorAll<HTMLButtonElement>('.ui-dialog__actions button'),
    );
    return buttons[buttons.length - 1];
  }

  beforeEach(() => {
    vehicles = signal<VehicleDetail[]>([vehicle(1, 'ABC-123', true), vehicle(2, 'XYZ-456', false)]);
    registeredVehicles = signal(2);
    hasReachedLimit = signal(false);
    isLoading = signal(false);
    hasFailed = signal(false);
    requests = signal<ParkingRequestInformation[]>([]);
    requestsFailed = signal(false);
    cycleName = signal<string | null>('2026-1');
    setAvailability = vi.fn(() => of(vehicle(1, 'ABC-123', false)));

    TestBed.configureTestingModule({
      imports: [MyVehiclesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: VehicleService,
          useValue: {
            vehicles,
            registeredVehicles,
            maxVehicles: signal(5),
            hasReachedLimit,
            isLoading,
            hasFailed,
            register: () => of(vehicle(3, 'DEF-789', true)),
            setAvailability,
            reload: () => undefined,
          },
        },
        {
          provide: ParkingRequestService,
          useValue: {
            requests,
            hasFailed: requestsFailed,
            reload: () => undefined,
          },
        },
        {
          provide: CurrentCycleService,
          useValue: {
            name: cycleName,
            hasFailed: signal(false),
            reload: () => undefined,
          },
        },
      ],
    });

    fixture = TestBed.createComponent(MyVehiclesPage);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra el contador de vehículos con datos reales', () => {
    expect(text()).toContain('Tienes 2 de 5 vehículos registrados');
  });

  it('lista los vehículos activos y deshabilitados con su estado', () => {
    expect(cards().length).toBe(2);
    expect(cards()[0].textContent).toContain('ABC-123');
    expect(cards()[0].textContent).toContain('Activo');
    expect(cards()[1].textContent).toContain('XYZ-456');
    expect(cards()[1].textContent).toContain('Deshabilitado');
  });

  it('ofrece deshabilitar un vehículo activo y habilitar uno deshabilitado', () => {
    expect(cards()[0].querySelector('button')!.textContent).toContain('Deshabilitar');
    expect(cards()[1].querySelector('button')!.textContent).toContain('Habilitar');
  });

  it('pide confirmación antes de deshabilitar', () => {
    clickAvailability(0);

    expect(text()).toContain('¿Deseas deshabilitar este vehículo?');
    expect(setAvailability).not.toHaveBeenCalled();
  });

  it('deshabilita el vehículo al confirmar', () => {
    clickAvailability(0);
    dialogConfirm().click();
    fixture.detectChanges();

    expect(setAvailability).toHaveBeenCalledWith(1, false);
    expect(text()).toContain('El vehículo ABC-123 fue deshabilitado.');
  });

  it('habilita el vehículo al confirmar', () => {
    clickAvailability(1);
    dialogConfirm().click();
    fixture.detectChanges();

    expect(setAvailability).toHaveBeenCalledWith(2, true);
    expect(text()).toContain('El vehículo XYZ-456 fue habilitado.');
  });

  it('deshabilita el botón de agregar cuando se alcanzó el máximo', () => {
    hasReachedLimit.set(true);
    registeredVehicles.set(5);
    fixture.detectChanges();

    expect(addVehicleButton().disabled).toBe(true);
    expect(text()).toContain('Has alcanzado el máximo de 5 vehículos registrados');
  });

  it('muestra el estado de carga mientras consulta los vehículos', () => {
    isLoading.set(true);
    fixture.detectChanges();

    expect(text()).toContain('Cargando tus vehículos');
  });

  it('muestra un mensaje de error cuando la consulta falla', () => {
    hasFailed.set(true);
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar tus vehículos');
  });

  it('indica que el ingreso está permitido con una solicitud aprobada del ciclo vigente', () => {
    requests.set([request(1, 'ABC-123', '2026-1', 'APROBADO')]);
    fixture.detectChanges();

    expect(cards()[0].textContent).toContain('Ingreso permitido');
    expect(cards()[0].textContent).toContain('Autorizado para ingresar');
    expect(cards()[0].querySelector('.vehicle__access--allowed')).not.toBeNull();
  });

  it('indica que no se permite usar el vehículo sin solicitud en el ciclo vigente', () => {
    requests.set([request(1, 'ABC-123', '2025-2', 'APROBADO')]);
    fixture.detectChanges();

    expect(cards()[0].textContent).toContain('Ingreso no permitido');
    expect(cards()[0].textContent).toContain('No tienes una solicitud aprobada en el ciclo 2026-1');
  });

  it('avisa que la solicitud sigue en revisión', () => {
    requests.set([request(1, 'ABC-123', '2026-1', 'EN REVISIÓN')]);
    fixture.detectChanges();

    expect(cards()[0].querySelector('.vehicle__access--in-review')).not.toBeNull();
    expect(cards()[0].textContent).toContain('sigue en revisión');
  });

  it('avisa que la solicitud del ciclo vigente fue rechazada', () => {
    requests.set([request(1, 'ABC-123', '2026-1', 'RECHAZADO')]);
    fixture.detectChanges();

    expect(cards()[0].querySelector('.vehicle__access--rejected')).not.toBeNull();
    expect(cards()[0].textContent).toContain('fue rechazada');
  });

  it('mantiene el permiso de ingreso aunque el vehículo esté deshabilitado', () => {
    requests.set([request(1, 'XYZ-456', '2026-1', 'APROBADO')]);
    fixture.detectChanges();

    expect(cards()[1].textContent).toContain('Deshabilitado');
    expect(cards()[1].textContent).toContain('Ingreso permitido');
  });

  it('no afirma nada sobre el ingreso cuando no se conoce el ciclo vigente', () => {
    cycleName.set(null);
    requests.set([request(1, 'ABC-123', '2026-1', 'APROBADO')]);
    fixture.detectChanges();

    expect(cards()[0].textContent).toContain('Ingreso por confirmar');
  });

  it('no afirma nada sobre el ingreso cuando fallan las solicitudes', () => {
    requestsFailed.set(true);
    requests.set([request(1, 'ABC-123', '2026-1', 'APROBADO')]);
    fixture.detectChanges();

    expect(cards()[0].textContent).toContain('Ingreso por confirmar');
  });

  it('invita a registrar un vehículo cuando no hay ninguno', () => {
    vehicles.set([]);
    registeredVehicles.set(0);
    fixture.detectChanges();

    expect(text()).toContain('Aún no tienes vehículos registrados');
  });
});
