import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUserService } from '../portal/current-user.service';
import { UserProfile } from '../portal/models/user-profile.model';
import { USERS_PATH } from '../portal/portal.constants';
import {
  ParkingRequestInformation,
  ParkingRequestInformationList,
  ParkingResponseIn,
  ParkingResponseOut,
} from './models/parking-request.model';
import { PARKING_REQUEST_PATH, PARKING_RESPONSE_PATH } from './parking.constants';
import { isPendingReview } from './request-status.util';

const REQUESTS_URL = `${environment.gatewayUrl}${PARKING_REQUEST_PATH}`;
const RESPONSES_URL = `${environment.gatewayUrl}${PARKING_RESPONSE_PATH}`;
const USERS_URL = `${environment.gatewayUrl}${USERS_PATH}`;

function byNewestFirst(a: ParkingRequestInformation, b: ParkingRequestInformation): number {
  const difference = b.dateRequest.localeCompare(a.dateRequest);
  return difference !== 0 ? difference : b.idRequest - a.idRequest;
}

@Injectable({ providedIn: 'root' })
export class ParkingReviewService {
  private readonly http = inject(HttpClient);
  private readonly currentUserService = inject(CurrentUserService);

  private readonly acceptorId = this.currentUserService.userId;

  private readonly resource = httpResource<ParkingRequestInformationList>(() => {
    const acceptorId = this.acceptorId();
    return acceptorId === null ? undefined : `${REQUESTS_URL}/acceptor/${acceptorId}`;
  });

  private readonly selectedApplicantId = signal<number | null>(null);

  readonly requests = computed(() =>
    [...(this.resource.value()?.parkingRequests ?? [])].sort(byNewestFirst),
  );
  readonly pendingRequests = computed(() => this.requests().filter(isPendingReview));
  readonly reviewedRequests = computed(() =>
    this.requests().filter((request) => !isPendingReview(request)),
  );

  readonly isLoading = computed(() =>
    this.acceptorId() === null ? this.currentUserService.isLoading() : this.resource.isLoading(),
  );
  readonly hasFailed = computed(() =>
    this.acceptorId() === null
      ? this.currentUserService.hasFailed()
      : this.resource.error() !== undefined,
  );

  private readonly applicantResource = httpResource<UserProfile>(() => {
    const idApplicant = this.selectedApplicantId();
    return idApplicant === null ? undefined : `${USERS_URL}/${idApplicant}`;
  });

  readonly applicantProfile = this.applicantResource.value;
  readonly applicantFailed = computed(() => this.applicantResource.error() !== undefined);

  selectApplicant(idApplicant: number | null): void {
    this.selectedApplicantId.set(idApplicant);
  }

  respond(requestId: number, response: ParkingResponseIn): Observable<ParkingResponseOut> {
    return this.http
      .patch<ParkingResponseOut>(`${RESPONSES_URL}/${requestId}`, response)
      .pipe(tap(() => this.resource.reload()));
  }

  reload(): void {
    this.resource.reload();
  }
}
