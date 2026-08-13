import { BadgeTone } from '../../shared/components/ui-badge/ui-badge';
import { ParkingRequestInformation } from './models/parking-request.model';

export type RequestOutcome = 'approved' | 'rejected' | 'pending';

function normalize(status: string): string {
  return status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function requestOutcome(request: ParkingRequestInformation): RequestOutcome {
  const status = normalize(request.status ?? '');

  if (status.includes('aprob')) {
    return 'approved';
  }
  if (status.includes('rechaz')) {
    return 'rejected';
  }
  return 'pending';
}

export function isPendingReview(request: ParkingRequestInformation): boolean {
  return requestOutcome(request) === 'pending';
}

export function isRejected(request: ParkingRequestInformation): boolean {
  return requestOutcome(request) === 'rejected';
}

export function statusTone(request: ParkingRequestInformation): BadgeTone {
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
