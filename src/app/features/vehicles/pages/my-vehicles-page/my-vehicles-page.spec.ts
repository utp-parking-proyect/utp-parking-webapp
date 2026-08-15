import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import {
  VehicleDetail,
  VehicleUnassignmentRequestDetail,
} from '../../../../core/parking/models/vehicle.model';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { VehicleService } from '../../../../core/parking/vehicle.service';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { MyVehiclesPage } from './my-vehicles-page';

function vehicle(idVehicle: number, numberPlate: string, active: boolean): VehicleDetail {
  return {
    idVehicle,
    numberPlate,
    idVehicleType: 1,
    vehicleType: 'Automóvil',
    status: active ? 'ACTIVE' : 'DISABLED',
  };
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

function unassignment(
  idVehicle: number,
  status: string,
  observation = 'El vehículo tiene una solicitud vigente.',
): VehicleUnassignmentRequestDetail {
  return {
    idUnassignmentRequest: 500 + idVehicle,
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
    workflow: [{ status, dateStatusChange: '2026-03-01T10:00:00Z', observation }],
  };
}

describe('MyVehiclesPage', () => {
  let fixture: ComponentFixture<MyVehiclesPage>;
  let vehicles: WritableSignal<VehicleDetail[]>;
  let activeVehicleCount: WritableSignal<number>;
  let hasReachedLimit: WritableSignal<boolean>;
  let isLoading: WritableSignal<boolean>;
  let hasFailed: WritableSignal<boolean>;
  let requests: WritableSignal<ParkingRequestInformation[]>;
  let requestsFailed: WritableSignal<boolean>;
  let cycleName: WritableSignal<string | null>;
  let setAvailability: ReturnType<typeof vi.fn>;
  let requestUnassignment: ReturnType<typeof vi.fn>;
  let unassignmentByVehicle: WritableSignal<Map<number, VehicleUnassignmentRequestDetail>>;
  let unassignedVehicles: WritableSignal<VehicleUnassignmentRequestDetail[]>;

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

  function unassignButton(index: number): HTMLButtonElement {
    const buttons = Array.from(
      cards()[index].querySelectorAll<HTMLButtonElement>('.vehicle__actions button'),
    );
    return buttons[buttons.length - 1];
  }

  function dialogConfirm(): HTMLButtonElement {
    const buttons = Array.from(
      host().querySelectorAll<HTMLButtonElement>('.ui-dialog__actions button'),
    );
    return buttons[buttons.length - 1];
  }

  beforeEach(() => {
    vehicles = signal<VehicleDetail[]>([vehicle(1, 'ABC-123', true), vehicle(2, 'XYZ-456', false)]);
    activeVehicleCount = signal(1);
    hasReachedLimit = signal(false);
    isLoading = signal(false);
    hasFailed = signal(false);
    requests = signal<ParkingRequestInformation[]>([]);
    requestsFailed = signal(false);
    cycleName = signal<string | null>('2026-1');
    setAvailability = vi.fn(() => of(vehicle(1, 'ABC-123', false)));
    unassignmentByVehicle = signal(new Map<number, VehicleUnassignmentRequestDetail>());
    unassignedVehicles = signal<VehicleUnassignmentRequestDetail[]>([]);
    requestUnassignment = vi.fn(() => of(unassignment(1, 'REGISTRADO')));

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
            activeVehicleCount,
            maxActiveVehicles: signal(5),
            hasReachedLimit,
            isLoading,
            hasFailed,
            register: () => of(vehicle(3, 'DEF-789', true)),
            setAvailability,
            reload: () => undefined,
          },
        },
        {
          provide: VehicleUnassignmentService,
          useValue: {
            latestByVehicle: unassignmentByVehicle,
            unassignedVehicles: unassignedVehicles,
            requestUnassignment,
            reload: () => undefined,
          },
        },
        {
          provide: ParkingRequestService,
          useValue: {
            requests,
            hasFailed: requestsFailed,
            currentCycleRequests: signal([]),
            maxRequestsPerCycle: 2,
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
    expect(text()).toContain('Tienes 1 de 5 vehículos activos');
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
    activeVehicleCount.set(5);
    fixture.detectChanges();

    expect(addVehicleButton().disabled).toBe(true);
    expect(text()).toContain('Has alcanzado el máximo de 5 vehículos activos');
  });

  it('no permite habilitar un vehículo cuando ya hay 5 activos', () => {
    hasReachedLimit.set(true);
    activeVehicleCount.set(5);
    fixture.detectChanges();

    const enableButton = cards()[1].querySelector<HTMLButtonElement>('.vehicle__actions button')!;

    expect(enableButton.disabled).toBe(true);
    expect(cards()[1].textContent).toContain(
      'Ya tienes 5 vehículos activos. Deshabilita otro vehículo antes de habilitar este.',
    );
    expect(setAvailability).not.toHaveBeenCalled();
  });

  it('sigue permitiendo deshabilitar cuando ya hay 5 activos', () => {
    hasReachedLimit.set(true);
    activeVehicleCount.set(5);
    fixture.detectChanges();

    clickAvailability(0);
    dialogConfirm().click();
    fixture.detectChanges();

    expect(setAvailability).toHaveBeenCalledWith(1, false);
  });

  it('ofrece solicitar la desasignación de un vehículo propio', () => {
    expect(unassignButton(0).textContent).toContain('Solicitar desasignación');
    expect(unassignButton(0).disabled).toBe(false);
  });

  it('pide el motivo antes de enviar la solicitud de desasignación', () => {
    unassignButton(0).click();
    fixture.detectChanges();

    expect(text()).toContain('Solicitar desasignación');
    expect(text()).toContain('Motivo');
    expect(requestUnassignment).not.toHaveBeenCalled();
  });

  it('avisa que desasignar no repone las solicitudes del ciclo', () => {
    unassignButton(0).click();
    fixture.detectChanges();

    expect(text()).toContain('Desasignar no repone tus solicitudes del ciclo');
    expect(text()).toContain('0 de 2 utilizadas');
  });

  it('advierte que se perderá la autorización vigente del vehículo', () => {
    requests.set([request(1, 'ABC-123', '2026-1', 'APROBADO')]);
    fixture.detectChanges();

    unassignButton(0).click();
    fixture.detectChanges();

    expect(text()).toContain('tiene una solicitud aprobada en el ciclo 2026-1');
    expect(text()).toContain('perderás la autorización de ingreso');
  });

  it('no advierte sobre autorización si el vehículo no la tiene vigente', () => {
    unassignButton(0).click();
    fixture.detectChanges();

    expect(text()).not.toContain('perderás la autorización de ingreso');
  });

  it('no envía la solicitud de desasignación sin motivo', () => {
    unassignButton(0).click();
    fixture.detectChanges();
    dialogConfirm().click();
    fixture.detectChanges();

    expect(requestUnassignment).not.toHaveBeenCalled();
    expect(text()).toContain('Indica el motivo de la desasignación.');
  });

  it('envía la solicitud de desasignación con el motivo indicado', () => {
    unassignButton(0).click();
    fixture.detectChanges();

    const textarea = host().querySelector<HTMLTextAreaElement>('#unassignment-reason')!;
    textarea.value = 'Vendí el vehículo.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    dialogConfirm().click();
    fixture.detectChanges();

    expect(requestUnassignment).toHaveBeenCalledWith(1, { reason: 'Vendí el vehículo.' });
    expect(text()).toContain('Enviamos tu solicitud de desasignación del vehículo ABC-123');
  });

  it('muestra la solicitud de desasignación pendiente y bloquea otra', () => {
    unassignmentByVehicle.set(new Map([[1, unassignment(1, 'EN_REVISION')]]));
    fixture.detectChanges();

    expect(cards()[0].textContent).toContain('Solicitud de desasignación pendiente');
    expect(unassignButton(0).disabled).toBe(true);

    unassignButton(0).click();
    fixture.detectChanges();

    expect(requestUnassignment).not.toHaveBeenCalled();
  });

  it('muestra el motivo del rechazo de la desasignación', () => {
    unassignmentByVehicle.set(
      new Map([[1, unassignment(1, 'RECHAZADO', 'El vehículo tiene una multa pendiente.')]]),
    );
    fixture.detectChanges();

    expect(cards()[0].textContent).toContain('Solicitud de desasignación rechazada');
    expect(cards()[0].textContent).toContain(
      'Motivo del rechazo: El vehículo tiene una multa pendiente.',
    );
    expect(unassignButton(0).disabled).toBe(false);
  });

  it('no muestra el historial de vehículos cuando no hay desasignados', () => {
    expect(host().querySelector('.history')).toBeNull();
  });

  it('muestra los vehículos desasignados en el historial de vehículos', () => {
    unassignedVehicles.set([unassignment(9, 'APROBADO')]);
    fixture.detectChanges();

    const history = host().querySelector('.history')!;
    expect(history).not.toBeNull();
    expect(history.textContent).toContain('Historial de vehículos');
    expect(history.textContent).toContain('ABC-123');
    expect(history.textContent).toContain('Desasignado');
    expect(history.textContent).toContain('Motivo: Vendí el vehículo.');
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

  it('no permite el ingreso de un vehículo deshabilitado con solicitud aprobada', () => {
    requests.set([request(1, 'XYZ-456', '2026-1', 'APROBADO')]);
    fixture.detectChanges();

    expect(cards()[1].textContent).toContain('Deshabilitado');
    expect(cards()[1].textContent).toContain('Ingreso no permitido');
    expect(cards()[1].textContent).not.toContain('Ingreso permitido');
    expect(cards()[1].textContent).toContain('este vehículo está deshabilitado');
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
    activeVehicleCount.set(0);
    fixture.detectChanges();

    expect(text()).toContain('Aún no tienes vehículos registrados');
  });
});
