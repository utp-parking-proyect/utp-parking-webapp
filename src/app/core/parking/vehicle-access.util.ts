import { BadgeTone } from '../../shared/components/ui-badge/ui-badge';
import { IconName } from '../../shared/components/ui-icon/ui-icon';
import { ParkingRequestInformation } from './models/parking-request.model';
import { VehicleDetail } from './models/vehicle.model';
import { requestOutcome, toDate } from './request-status.util';

export type VehicleAccessStatus =
  | 'allowed'
  | 'in-review'
  | 'rejected'
  | 'no-request'
  | 'unknown';

export interface VehicleAccess {
  status: VehicleAccessStatus;
  cycleName: string | null;
  request: ParkingRequestInformation | null;
}

const ACCESS_TONES: Readonly<Record<VehicleAccessStatus, BadgeTone>> = {
  allowed: 'success',
  'in-review': 'warning',
  rejected: 'danger',
  'no-request': 'neutral',
  unknown: 'neutral',
};

const ACCESS_ICONS: Readonly<Record<VehicleAccessStatus, IconName>> = {
  allowed: 'shield-check',
  'in-review': 'clock',
  rejected: 'alert-triangle',
  'no-request': 'info',
  unknown: 'help-circle',
};

export const UNKNOWN_VEHICLE_ACCESS: VehicleAccess = {
  status: 'unknown',
  cycleName: null,
  request: null,
};

function plateKey(numberPlate: string | null | undefined): string {
  return (numberPlate ?? '').trim().toUpperCase();
}

function cycleOf(request: ParkingRequestInformation): string {
  return request.applicant?.numberCycle?.trim() ?? '';
}

function byNewestFirst(a: ParkingRequestInformation, b: ParkingRequestInformation): number {
  const timeA = toDate(a.dateRequest)?.getTime() ?? 0;
  const timeB = toDate(b.dateRequest)?.getTime() ?? 0;
  return timeA !== timeB ? timeB - timeA : b.idRequest - a.idRequest;
}

export function vehicleAccessFor(
  vehicle: VehicleDetail,
  requests: readonly ParkingRequestInformation[],
  currentCycleName: string | null,
): VehicleAccess {
  if (!currentCycleName?.trim()) {
    return UNKNOWN_VEHICLE_ACCESS;
  }

  const cycleName = currentCycleName.trim();
  const key = plateKey(vehicle.numberPlate);
  const request =
    requests
      .filter((item) => plateKey(item.vehicle?.numberPlate) === key && cycleOf(item) === cycleName)
      .sort(byNewestFirst)[0] ?? null;

  if (request === null) {
    return { status: 'no-request', cycleName, request: null };
  }

  switch (requestOutcome(request)) {
    case 'approved':
      return { status: 'allowed', cycleName, request };
    case 'rejected':
      return { status: 'rejected', cycleName, request };
    default:
      return { status: 'in-review', cycleName, request };
  }
}

export function vehicleAccessLabel(access: VehicleAccess): string {
  switch (access.status) {
    case 'allowed':
      return 'Ingreso permitido';
    case 'unknown':
      return 'Ingreso por confirmar';
    default:
      return 'Ingreso no permitido';
  }
}

export function vehicleAccessTone(access: VehicleAccess): BadgeTone {
  return ACCESS_TONES[access.status];
}

export function vehicleAccessIcon(access: VehicleAccess): IconName {
  return ACCESS_ICONS[access.status];
}
