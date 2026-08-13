import { httpResource } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ParkingRequestDetail } from './models/parking-request.model';
import { PARKING_REQUEST_PATH } from './parking.constants';

const REQUESTS_URL = `${environment.gatewayUrl}${PARKING_REQUEST_PATH}`;

@Injectable({ providedIn: 'root' })
export class ParkingRequestDetailService {
  private readonly requestId = signal<number | null>(null);

  private readonly resource = httpResource<ParkingRequestDetail>(() => {
    const requestId = this.requestId();
    return requestId === null ? undefined : `${REQUESTS_URL}/${requestId}`;
  });

  readonly detail = this.resource.value;
  readonly isLoading = this.resource.isLoading;
  readonly hasFailed = computed(() => this.resource.error() !== undefined);

  select(requestId: number | null): void {
    this.requestId.set(requestId);
  }

  reload(): void {
    this.resource.reload();
  }
}
