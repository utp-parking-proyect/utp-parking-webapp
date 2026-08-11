import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { CurrentUserService } from '../portal/current-user.service';
import {
  ParkingRequestIn,
  ParkingRequestInformation,
  ParkingRequestInformationList,
  ParkingRequestOut,
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
  private readonly authService = inject(AuthService);
  private readonly currentUserService = inject(CurrentUserService);

  private readonly applicantId = computed(
    () => this.authService.session()?.userId ?? this.currentUserService.profile()?.idUser ?? null,
  );

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

  /** Los vehículos del usuario solo existen a través de sus solicitudes: no hay endpoint propio. */
  readonly vehicles = computed<ApplicantVehicle[]>(() => {
    const seen = new Map<string, ApplicantVehicle>();
    for (const request of this.requests()) {
      const { numberPlate, vehicleType } = request.Vehicle;
      if (numberPlate && !seen.has(numberPlate)) {
        seen.set(numberPlate, { numberPlate, vehicleType });
      }
    }
    return [...seen.values()];
  });

  create(request: ParkingRequestIn): Observable<ParkingRequestOut> {
    return this.http.post<ParkingRequestOut>(REQUESTS_URL, request);
  }

  reload(): void {
    this.resource.reload();
  }
}
