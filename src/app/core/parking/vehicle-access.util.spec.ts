import { ParkingRequestInformation } from './models/parking-request.model';
import { VehicleDetail } from './models/vehicle.model';
import { vehicleAccessFor, vehicleAccessLabel, vehicleAccessTone } from './vehicle-access.util';

function vehicle(numberPlate: string, active = true): VehicleDetail {
  return {
    idVehicle: 1,
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
  dateRequest = '2026-03-01T10:00:00Z',
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
    dateRequest,
    dateResponse: null,
    status,
  };
}

describe('vehicleAccessFor', () => {
  it('permite el ingreso con una solicitud aprobada del ciclo vigente', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [request(1, 'ABC-123', '2026-1', 'APROBADO')],
      '2026-1',
    );

    expect(access.status).toBe('allowed');
    expect(access.cycleName).toBe('2026-1');
    expect(vehicleAccessLabel(access)).toBe('Ingreso permitido');
    expect(vehicleAccessTone(access)).toBe('success');
  });

  it('no permite el ingreso si la solicitud aprobada es de un ciclo anterior', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [request(1, 'ABC-123', '2025-2', 'APROBADO')],
      '2026-1',
    );

    expect(access.status).toBe('no-request');
    expect(access.request).toBeNull();
    expect(vehicleAccessLabel(access)).toBe('Ingreso no permitido');
  });

  it('marca en revisión mientras la solicitud del ciclo vigente no tiene respuesta', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [request(1, 'ABC-123', '2026-1', 'EN REVISIÓN')],
      '2026-1',
    );

    expect(access.status).toBe('in-review');
    expect(vehicleAccessTone(access)).toBe('warning');
    expect(vehicleAccessLabel(access)).toBe('Ingreso no permitido');
  });

  it('marca rechazado cuando la solicitud del ciclo vigente fue rechazada', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [request(1, 'ABC-123', '2026-1', 'RECHAZADO')],
      '2026-1',
    );

    expect(access.status).toBe('rejected');
    expect(vehicleAccessTone(access)).toBe('danger');
  });

  it('usa la solicitud más reciente del ciclo cuando hay varias', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [
        request(1, 'ABC-123', '2026-1', 'RECHAZADO', '2026-03-01T10:00:00Z'),
        request(2, 'ABC-123', '2026-1', 'APROBADO', '2026-03-15T10:00:00Z'),
      ],
      '2026-1',
    );

    expect(access.status).toBe('allowed');
    expect(access.request?.idRequest).toBe(2);
  });

  it('ignora las solicitudes de otros vehículos', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [request(1, 'XYZ-987', '2026-1', 'APROBADO')],
      '2026-1',
    );

    expect(access.status).toBe('no-request');
  });

  it('compara las placas sin distinguir mayúsculas ni espacios', () => {
    const access = vehicleAccessFor(
      vehicle(' abc-123 '),
      [request(1, 'ABC-123', '2026-1', 'APROBADO')],
      '2026-1',
    );

    expect(access.status).toBe('allowed');
  });

  it('devuelve un estado desconocido cuando no se conoce el ciclo vigente', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123'),
      [request(1, 'ABC-123', '2026-1', 'APROBADO')],
      null,
    );

    expect(access.status).toBe('unknown');
    expect(vehicleAccessLabel(access)).toBe('Ingreso por confirmar');
  });

  it('devuelve sin solicitud cuando el usuario no tiene ninguna', () => {
    const access = vehicleAccessFor(vehicle('ABC-123'), [], '2026-1');

    expect(access.status).toBe('no-request');
  });

  it('no permite el ingreso si el vehículo está deshabilitado pese a la solicitud aprobada', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123', false),
      [request(1, 'ABC-123', '2026-1', 'APROBADO')],
      '2026-1',
    );

    expect(access.status).toBe('not-active');
    expect(vehicleAccessLabel(access)).toBe('Ingreso no permitido');
    expect(access.request?.status).toBe('APROBADO');
  });

  it('mantiene el rechazo cuando el vehículo está deshabilitado y la solicitud fue rechazada', () => {
    const access = vehicleAccessFor(
      vehicle('ABC-123', false),
      [request(1, 'ABC-123', '2026-1', 'RECHAZADO')],
      '2026-1',
    );

    expect(access.status).toBe('rejected');
  });

  it('informa que no hay solicitud aunque el vehículo esté deshabilitado', () => {
    const access = vehicleAccessFor(vehicle('ABC-123', false), [], '2026-1');

    expect(access.status).toBe('no-request');
  });
});
