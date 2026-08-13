import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUserService } from '../portal/current-user.service';
import { ParkingRequestDetailService } from './parking-request-detail.service';
import {
  ParkingRequestIn,
  ParkingRequestInformation,
  ParkingRequestInformationList,
  ParkingRequestOut,
  ParkingRequestResubmitIn,
} from './models/parking-request.model';
import { ApplicantVehicle } from './models/vehicle.model';
import { PARKING_REQUEST_PATH } from './parking.constants';

const REQUESTS_URL = `${environment.gatewayUrl}${PARKING_REQUEST_PATH}`;

function byNewestFirst(a: ParkingRequestInformation, b: ParkingRequestInformation): number {
  const difference = b.dateRequest.localeCompare(a.dateRequest);
  return difference !== 0 ? difference : b.idRequest - a.idRequest;
}

@Injectable({ providedIn: 'root' })
export class ParkingRequestService {
  private readonly http = inject(HttpClient);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly detailService = inject(ParkingRequestDetailService);

  private readonly applicantId = this.currentUserService.userId;

  private readonly resource = httpResource<ParkingRequestInformationList>(() => {
    const applicantId = this.applicantId();
    return applicantId === null ? undefined : `${REQUESTS_URL}/applicant/${applicantId}`;
  });

  readonly requests = computed(() =>
    [...(this.resource.value()?.parkingRequests ?? [])].sort(byNewestFirst),
  );
  readonly isLoading = computed(() =>
    this.applicantId() === null ? this.currentUserService.isLoading() : this.resource.isLoading(),
  );
  readonly hasFailed = computed(() =>
    this.applicantId() === null
      ? this.currentUserService.hasFailed()
      : this.resource.error() !== undefined,
  );

  readonly vehicles = computed<ApplicantVehicle[]>(() => {
    const seen = new Map<string, ApplicantVehicle>();
    for (const request of this.requests()) {
      const { numberPlate, vehicleType } = request.vehicle;
      if (numberPlate && !seen.has(numberPlate)) {
        seen.set(numberPlate, { numberPlate, vehicleType });
      }
    }
    return [...seen.values()];
  });

  create(request: ParkingRequestIn): Observable<ParkingRequestOut> {
    return this.http.post<ParkingRequestOut>(REQUESTS_URL, request);
  }

  resubmit(
    requestId: number,
    resubmission?: ParkingRequestResubmitIn,
  ): Observable<ParkingRequestOut> {
    return this.http
      .post<ParkingRequestOut>(`${REQUESTS_URL}/${requestId}/resubmit`, resubmission ?? null)
      .pipe(
        tap(() => {
          this.resource.reload();
          this.detailService.reload();
        }),
      );
  }

  reload(): void {
    this.resource.reload();
  }
}
