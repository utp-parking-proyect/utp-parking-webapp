export interface VehicleTypeOption {
  idVehicleType: number;
  name: string;
}

export interface VehicleDetail {
  idVehicle: number;
  numberPlate: string;
  idVehicleType: number;
  vehicleType: string;
  active: boolean;
}

export interface VehicleDetailList {
  vehicles: VehicleDetail[];
  registeredVehicles: number;
  maxVehicles: number;
}

export interface VehicleIn {
  vehicleType: number;
  numberPlate: string;
}

export interface VehicleAvailabilityIn {
  active: boolean;
}
