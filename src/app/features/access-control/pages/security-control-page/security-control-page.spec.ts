import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AccessControlService } from '../../../../core/control/access-control.service';
import {
  AccessControlIn,
  AccessControlOut,
} from '../../../../core/control/models/access-control.model';
import { LocationAvailability } from '../../../../core/control/models/parking-availability.model';
import { ParkingAvailabilityService } from '../../../../core/control/parking-availability.service';
import { SecurityControlPage } from './security-control-page';

const AREQUIPA: LocationAvailability = {
  locationId: 1,
  locationName: 'Sede Arequipa',
  campusId: 1,
  campusName: 'Lima Centro',
  capacity: 75,
  occupied: 43,
  available: 32,
};

const PETIT_THOUARS: LocationAvailability = {
  locationId: 2,
  locationName: 'Sede Petit Thouars',
  campusId: 1,
  campusName: 'Lima Centro',
  capacity: 70,
  occupied: 29,
  available: 41,
};

function entryResult(overrides: Partial<AccessControlOut> = {}): AccessControlOut {
  return {
    authorized: true,
    result: 'ENTRY_REGISTERED',
    message: 'Ingreso autorizado',
    vehicle: { numberPlate: 'ABC-123', vehicleType: 'Automóvil' },
    applicant: {
      idApplicant: 10,
      nameApplicant: 'Juan',
      lastNameApplicant: 'Pérez',
      usernameApplicant: 'U23201703',
      numberCycle: '2026-1',
    },
    location: {
      idLocation: 1,
      nameLocation: 'Sede Arequipa',
      address: 'Av. Arequipa 265 - 279',
      campusName: 'Lima Centro',
    },
    availability: { ...AREQUIPA, occupied: 44, available: 31 },
    record: { idRecord: 500, entryDate: '2026-08-15T08:30:00', departureDate: null },
    ...overrides,
  };
}

describe('SecurityControlPage', () => {
  let fixture: ComponentFixture<SecurityControlPage>;
  let availability: WritableSignal<LocationAvailability[]>;
  let entries: AccessControlIn[];
  let exits: AccessControlIn[];
  let entryResponse: () => Observable<AccessControlOut>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function build(): void {
    fixture = TestBed.createComponent(SecurityControlPage);
    fixture.detectChanges();
  }

  function plateInput(): HTMLInputElement {
    return host().querySelector<HTMLInputElement>('#number-plate')!;
  }

  function typePlate(plate: string): void {
    const input = plateInput();
    input.value = plate;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function buttons(): HTMLButtonElement[] {
    return [...host().querySelectorAll<HTMLButtonElement>('button.ui-button')];
  }

  function clickEntry(): void {
    buttons()[0].click();
    fixture.detectChanges();
  }

  function clickExit(): void {
    buttons()[1].click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    availability = signal([AREQUIPA, PETIT_THOUARS]);
    entries = [];
    exits = [];
    entryResponse = () => of(entryResult());

    TestBed.configureTestingModule({
      imports: [SecurityControlPage],
      providers: [
        {
          provide: ParkingAvailabilityService,
          useValue: {
            availability,
            isLoading: signal(false),
            hasFailed: signal(false),
            connectionStatus: signal('connected'),
            realtimeUpdates: () => EMPTY,
            reload: () => undefined,
          },
        },
        {
          provide: AccessControlService,
          useValue: {
            registerEntry: (movement: AccessControlIn) => {
              entries.push(movement);
              return entryResponse();
            },
            registerExit: (movement: AccessControlIn) => {
              exits.push(movement);
              return of(
                entryResult({
                  result: 'EXIT_REGISTERED',
                  message: 'Salida registrada',
                  record: {
                    idRecord: 500,
                    entryDate: '2026-08-15T08:30:00',
                    departureDate: '2026-08-15T18:05:00',
                  },
                }),
              );
            },
          },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('preselecciona la primera sede disponible', () => {
    build();

    expect(text()).toContain('Sede Arequipa');
    expect(text()).toContain('Ocupados: 43 / 75');
  });

  it('normaliza la placa ingresada', () => {
    build();
    typePlate('abc-123');

    expect(plateInput().value).toBe('ABC-123');
  });

  it('registra el ingreso con la placa y la sede seleccionada', () => {
    build();
    typePlate('ABC-123');
    clickEntry();

    expect(entries).toEqual([{ numberPlate: 'ABC-123', locationId: 1 }]);
    expect(text()).toContain('Ingreso autorizado');
    expect(text()).toContain('ABC-123');
    expect(text()).toContain('Juan Pérez');
  });

  it('registra la salida con la placa y la sede seleccionada', () => {
    build();
    typePlate('ABC-123');
    clickExit();

    expect(exits).toEqual([{ numberPlate: 'ABC-123', locationId: 1 }]);
    expect(text()).toContain('Salida registrada');
  });

  it('no envía el movimiento sin placa', () => {
    build();
    clickEntry();

    expect(entries.length).toBe(0);
    expect(text()).toContain('Ingresa la placa del vehículo.');
  });

  it('limpia la placa después de un movimiento registrado', () => {
    build();
    typePlate('ABC-123');
    clickEntry();

    expect(plateInput().value).toBe('');
  });

  it('muestra el motivo de negocio cuando el ingreso es rechazado', () => {
    entryResponse = () =>
      of(
        entryResult({
          authorized: false,
          result: 'PARKING_FULL',
          message: 'El estacionamiento de la sede no tiene espacios disponibles',
          record: null,
        }),
      );

    build();
    typePlate('ABC-123');
    clickEntry();

    expect(text()).toContain('El estacionamiento de la sede no tiene espacios disponibles');
    expect(host().querySelector('.result--rejected')).not.toBeNull();
  });

  it('muestra un aviso cuando el servicio falla', () => {
    entryResponse = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { description: 'business-parking-request no se encuentra disponible' },
          }),
      );

    build();
    typePlate('ABC-123');
    clickEntry();

    expect(text()).toContain('business-parking-request no se encuentra disponible');
  });

  it('informa el estado de la conexión en tiempo real', () => {
    build();

    expect(text()).toContain('Actualizando en tiempo real');
  });
});
