export interface LocationAvailability {
  locationId: number;
  locationName: string;
  campusId: number | null;
  campusName: string | null;
  capacity: number;
  occupied: number;
  available: number;
  updatedAt?: string;
}

export interface ParkingAvailabilityList {
  availability: LocationAvailability[];
}

export interface CampusAvailability {
  campusId: number | null;
  campusName: string;
  locations: LocationAvailability[];
  capacity: number;
  occupied: number;
  available: number;
}

export type AvailabilityTone = 'free' | 'medium' | 'low' | 'full';
