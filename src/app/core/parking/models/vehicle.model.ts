import { ApplicantInformation, VehicleInformation, WorkflowEntry } from './parking-request.model';

export type VehicleStatus = 'ASSIGNED' | 'UNASSIGNED';

export interface VehicleTypeOption {
  idVehicleType: number;
  name: string;
}

export interface VehicleDetail {
  idVehicle: number;
  numberPlate: string;
  idVehicleType: number;
  vehicleType: string;
  status: VehicleStatus;
}

export interface VehicleDetailList {
  vehicles: VehicleDetail[];
  assignedVehicles: number;
  maxAssignedVehicles: number;
}

export interface VehicleIn {
  vehicleType: number;
  numberPlate: string;
}

export interface VehicleUnassignmentIn {
  reason: string;
}

export interface VehicleUnassignmentRequestDetail {
  idUnassignmentRequest: number;
  idVehicle: number;
  applicant: ApplicantInformation;
  vehicle: VehicleInformation;
  reason: string;
  status: string;
  dateRequest: string;
  dateResponse: string | null;
  workflow: WorkflowEntry[];
}

export interface VehicleUnassignmentRequestList {
  unassignmentRequests: VehicleUnassignmentRequestDetail[];
}
