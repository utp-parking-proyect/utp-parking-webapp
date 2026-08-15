import { BadgeTone } from '../../shared/components/ui-badge/ui-badge';
import { ParkingRequestInformation } from './models/parking-request.model';

export type RequestOutcome = 'approved' | 'rejected' | 'pending';

export interface StatusHolder {
  status?: string | null;
}

function normalize(status: string): string {
  return status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function requestOutcome(request: StatusHolder): RequestOutcome {
  const status = normalize(request.status ?? '');

  if (status.includes('aprob')) {
    return 'approved';
  }
  if (status.includes('rechaz')) {
    return 'rejected';
  }
  return 'pending';
}

export function isPendingReview(request: StatusHolder): boolean {
  return requestOutcome(request) === 'pending';
}

export function isRejected(request: StatusHolder): boolean {
  return requestOutcome(request) === 'rejected';
}

export function isFromCurrentCycle(
  request: ParkingRequestInformation,
  currentCycleName: string | null,
): boolean {
  if (currentCycleName === null) {
    return false;
  }
  return (request.applicant?.numberCycle?.trim() ?? '') === currentCycleName;
}

export function canResubmit(
  request: ParkingRequestInformation,
  currentCycleName: string | null,
): boolean {
  return isRejected(request) && isFromCurrentCycle(request, currentCycleName);
}

export function statusTone(request: StatusHolder): BadgeTone {
  switch (requestOutcome(request)) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return normalize(request.status ?? '').includes('revis') ? 'warning' : 'brand';
  }
}

export function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
