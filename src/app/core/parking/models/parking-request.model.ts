export interface ParkingRequestIn {
  numberPlate: string;
  vehicleType?: number;
}

export interface ParkingRequestOut {
  parkingRequestId: number;
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
  Applicant: ApplicantInformation;
  Vehicle: VehicleInformation;
  dateRequest: string;
  dateResponse: string | null;
  status: string;
}

export interface ParkingRequestInformationList {
  parkingRequests: ParkingRequestInformation[];
}
