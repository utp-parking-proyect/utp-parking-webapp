export interface ParkingRequestIn {
  numberPlate: string;
  vehicleType?: number;
}

export interface ParkingRequestOut {
  parkingRequestId: number;
}

export interface ParkingRequestResubmitIn {
  observation?: string;
}

export interface VehicleInformation {
  vehicleType: string;
  numberPlate: string;
}

export interface ApplicantInformation {
  idApplicant: number;
  nameApplicant: string;
  lastNameApplicant: string;
  usernameApplicant: string;
  numberCycle: string;
}

export interface ParkingRequestInformation {
  idRequest: number;
  applicant: ApplicantInformation;
  vehicle: VehicleInformation;
  dateRequest: string;
  dateResponse: string | null;
  status: string;
}

export interface ParkingRequestInformationList {
  parkingRequests: ParkingRequestInformation[];
}

export interface WorkflowEntry {
  status: string;
  dateStatusChange: string;
  observation: string | null;
}

export interface ParkingRequestDetail extends ParkingRequestInformation {
  workflow: WorkflowEntry[];
}

export interface ParkingResponseIn {
  approved: boolean;
  comment?: string;
}

export interface ParkingResponseOut {
  approved: boolean;
  comment: string;
  statusId: number;
}
