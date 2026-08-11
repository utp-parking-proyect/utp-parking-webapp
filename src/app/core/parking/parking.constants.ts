import { VehicleTypeOption } from './models/vehicle.model';

export const PARKING_API_PATH = '/gateway/utp-parking';

export const PARKING_REQUEST_PATH = `${PARKING_API_PATH}/request`;

export const PARKING_APP_CODE = 'P0';

export const PARKING_CALLER_NAME = 'utp-parking-webapp';

/**
 * El contrato de business-parking-request no expone un catálogo de tipos de vehículo,
 * pero `ParkingRequestIn.vehicleType` exige el id de la tabla `vehicle_type`.
 * Este listado refleja esa tabla y debe actualizarse si el catálogo cambia.
 */
export const VEHICLE_TYPES: readonly VehicleTypeOption[] = [
  { idVehicleType: 1, name: 'Automóvil' },
  { idVehicleType: 2, name: 'Camioneta' },
  { idVehicleType: 3, name: 'Motocicleta' },
  { idVehicleType: 4, name: 'Trimoto' },
  { idVehicleType: 5, name: 'Moto eléctrica' },
];
