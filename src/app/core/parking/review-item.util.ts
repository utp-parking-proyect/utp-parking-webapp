import { IconName } from '../../shared/components/ui-icon/ui-icon';
import { ParkingRequestInformation } from './models/parking-request.model';
import { VehicleUnassignmentRequestDetail } from './models/vehicle.model';

export type ReviewKind = 'parking' | 'unassignment';

export interface ReviewItem {
  kind: ReviewKind;
  id: number;
  applicantName: string;
  username: string;
  numberPlate: string;
  vehicleType: string;
  cycle: string | null;
  status: string;
  dateRequest: string;
  dateResponse: string | null;
  reason: string | null;
  observation: string | null;
}

export const REVIEW_KIND_LABELS: Readonly<Record<ReviewKind, string>> = {
  parking: 'Ingreso',
  unassignment: 'Desasignación',
};

export const REVIEW_KIND_LONG_LABELS: Readonly<Record<ReviewKind, string>> = {
  parking: 'Ingreso al estacionamiento',
  unassignment: 'Desasignación de vehículo',
};

export const REVIEW_KIND_ICONS: Readonly<Record<ReviewKind, IconName>> = {
  parking: 'clipboard',
  unassignment: 'car',
};

function fullName(name?: string | null, lastName?: string | null): string {
  return [name, lastName].filter(Boolean).join(' ').trim() || '—';
}

function lastObservation(request: VehicleUnassignmentRequestDetail): string | null {
  return request.workflow[request.workflow.length - 1]?.observation ?? null;
}

export function parkingReviewItem(request: ParkingRequestInformation): ReviewItem {
  const { nameApplicant, lastNameApplicant, usernameApplicant, numberCycle } =
    request.applicant ?? {};

  return {
    kind: 'parking',
    id: request.idRequest,
    applicantName: fullName(nameApplicant, lastNameApplicant),
    username: usernameApplicant ?? '',
    numberPlate: request.vehicle?.numberPlate ?? '',
    vehicleType: request.vehicle?.vehicleType ?? '',
    cycle: numberCycle?.trim() || null,
    status: request.status,
    dateRequest: request.dateRequest,
    dateResponse: request.dateResponse,
    reason: null,
    observation: null,
  };
}

export function unassignmentReviewItem(request: VehicleUnassignmentRequestDetail): ReviewItem {
  const { nameApplicant, lastNameApplicant, usernameApplicant } = request.applicant ?? {};

  return {
    kind: 'unassignment',
    id: request.idUnassignmentRequest,
    applicantName: fullName(nameApplicant, lastNameApplicant),
    username: usernameApplicant ?? '',
    numberPlate: request.vehicle?.numberPlate ?? '',
    vehicleType: request.vehicle?.vehicleType ?? '',
    cycle: null,
    status: request.status,
    dateRequest: request.dateRequest,
    dateResponse: request.dateResponse,
    reason: request.reason,
    observation: lastObservation(request),
  };
}
