import { MOTORCYCLE_VEHICLE_TYPE_IDS } from './parking.constants';

const CAR_PLATE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;
const MOTORCYCLE_PLATE_PATTERN = /^[A-Z0-9]{2}-[A-Z0-9]{4}$/;

const CAR_PREFIX_LENGTH = 3;
const MOTORCYCLE_PREFIX_LENGTH = 2;

export const PLATE_MAX_LENGTH = 7;

export function isMotorcycleType(idVehicleType: number | null | undefined): boolean {
  return idVehicleType !== null && MOTORCYCLE_VEHICLE_TYPE_IDS.includes(idVehicleType as number);
}

export function plateExampleFor(idVehicleType: number | null | undefined): string {
  return isMotorcycleType(idVehicleType) ? 'AB-1234' : 'ABC-123';
}

export function plateErrorFor(idVehicleType: number | null | undefined): string {
  return isMotorcycleType(idVehicleType)
    ? 'La placa de una motocicleta debe tener el formato AB-1234 (2-4 caracteres).'
    : 'La placa de un automóvil o camioneta debe tener el formato ABC-123 (3-3 caracteres).';
}

export function isValidPlate(plate: string, idVehicleType: number | null | undefined): boolean {
  const pattern = isMotorcycleType(idVehicleType) ? MOTORCYCLE_PLATE_PATTERN : CAR_PLATE_PATTERN;
  return pattern.test(plate);
}

export function formatPlate(value: string, idVehicleType: number | null | undefined): string {
  const characters = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, PLATE_MAX_LENGTH - 1);

  if (idVehicleType === null || idVehicleType === undefined) {
    return characters;
  }

  const prefixLength = isMotorcycleType(idVehicleType)
    ? MOTORCYCLE_PREFIX_LENGTH
    : CAR_PREFIX_LENGTH;

  return characters.length > prefixLength
    ? `${characters.slice(0, prefixLength)}-${characters.slice(prefixLength)}`
    : characters;
}
