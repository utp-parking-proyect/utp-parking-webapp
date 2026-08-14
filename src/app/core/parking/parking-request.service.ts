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
import { CurrentCycleService } from '../portal/current-cycle.service';
import { MAX_REQUESTS_PER_CYCLE, PARKING_REQUEST_PATH } from './parking.constants';

const REQUESTS_URL = `${environment.gatewayUrl}${PARKING_REQUEST_PATH}`;

function byNewestFirst(a: ParkingRequestInformation, b: ParkingRequestInformation): number {
  const difference = b.dateRequest.localeCompare(a.dateRequest);
  return difference !== 0 ? difference : b.idRequest - a.idRequest;
}

@Injectable({ providedIn: 'root' })
export class ParkingRequestService {
  private readonly http = inject(HttpClient);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly currentCycleService = inject(CurrentCycleService);
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

  readonly maxRequestsPerCycle = MAX_REQUESTS_PER_CYCLE;

  readonly currentCycleRequests = computed(() => {
    const cycleName = this.currentCycleService.name();
    return cycleName === null
      ? []
      : this.requests().filter((request) => request.applicant.numberCycle?.trim() === cycleName);
  });

  readonly hasReachedCycleLimit = computed(
    () =>
      this.currentCycleService.name() !== null &&
      this.currentCycleRequests().length >= MAX_REQUESTS_PER_CYCLE,
  );

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
