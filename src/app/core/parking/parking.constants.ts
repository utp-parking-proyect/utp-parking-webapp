import { VehicleTypeOption } from './models/vehicle.model';

export const PARKING_API_PATH = '/gateway/utp-parking';

export const PARKING_REQUEST_PATH = `${PARKING_API_PATH}/request`;

export const PARKING_RESPONSE_PATH = `${PARKING_API_PATH}/response`;

export const PARKING_VEHICLE_PATH = `${PARKING_API_PATH}/vehicles`;

export const MAX_REQUESTS_PER_CYCLE = 2;

export const PARKING_APP_CODE = 'P0';

export const PARKING_CALLER_NAME = 'utp-parking-webapp';

export const VEHICLE_TYPES: readonly VehicleTypeOption[] = [
  { idVehicleType: 1, name: 'Automóvil' },
  { idVehicleType: 2, name: 'Motocicleta' },
  { idVehicleType: 3, name: 'Camioneta' },
];

export const MOTORCYCLE_VEHICLE_TYPE_IDS: readonly number[] = [2];
