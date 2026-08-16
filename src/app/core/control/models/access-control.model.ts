import {
  ApplicantInformation,
  VehicleInformation,
} from '../../parking/models/parking-request.model';
import { LocationAvailability } from './parking-availability.model';

export type AccessControlResult =
  | 'ENTRY_REGISTERED'
  | 'EXIT_REGISTERED'
  | 'VEHICLE_NOT_FOUND'
  | 'VEHICLE_UNASSIGNED'
  | 'REQUEST_NOT_APPROVED'
  | 'VEHICLE_ALREADY_INSIDE'
  | 'PARKING_FULL'
  | 'NO_OPEN_RECORD'
  | 'RECORD_AT_OTHER_LOCATION';

export interface AccessControlIn {
  numberPlate: string;
  locationId: number;
  observation?: string;
}

export interface AccessRecord {
  idRecord: number;
  entryDate: string | null;
  departureDate: string | null;
}

export interface LocationInformation {
  idLocation: number;
  nameLocation: string;
  address: string | null;
  campusName: string | null;
}

export interface AccessControlOut {
  authorized: boolean;
  result: AccessControlResult;
  message: string;
  vehicle: VehicleInformation | null;
  applicant: ApplicantInformation | null;
  location: LocationInformation | null;
  availability: LocationAvailability | null;
  record: AccessRecord | null;
}
