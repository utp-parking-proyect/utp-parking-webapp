import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { injectRoleAccess } from '../auth/role-access';
import { CurrentUserService } from '../portal/current-user.service';
import { ParkingResponseIn } from './models/parking-request.model';
import {
  VehicleUnassignmentIn,
  VehicleUnassignmentRequestDetail,
  VehicleUnassignmentRequestList,
} from './models/vehicle.model';
import { PARKING_VEHICLE_PATH } from './parking.constants';

const VEHICLES_URL = `${environment.gatewayUrl}${PARKING_VEHICLE_PATH}`;
const UNASSIGNMENTS_URL = `${VEHICLES_URL}/unassignment-requests`;

const OPEN_STATUSES = ['REGISTRADO', 'EN_REVISION', 'REENVIADO'];

export function isOpenUnassignment(request: VehicleUnassignmentRequestDetail): boolean {
  return OPEN_STATUSES.includes(request.status);
}

export function isRejectedUnassignment(request: VehicleUnassignmentRequestDetail): boolean {
  return request.status === 'RECHAZADO';
}

export function isApprovedUnassignment(request: VehicleUnassignmentRequestDetail): boolean {
  return request.status === 'APROBADO';
}

function byNewestFirst(
  a: VehicleUnassignmentRequestDetail,
  b: VehicleUnassignmentRequestDetail,
): number {
  return b.idUnassignmentRequest - a.idUnassignmentRequest;
}

@Injectable({ providedIn: 'root' })
export class VehicleUnassignmentService {
  private readonly http = inject(HttpClient);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly access = injectRoleAccess();

  private readonly acceptorId = this.currentUserService.userId;

  private readonly mineResource = httpResource<VehicleUnassignmentRequestList>(() =>
    this.access.isApplicant() ? `${UNASSIGNMENTS_URL}/me` : undefined,
  );

  private readonly acceptorResource = httpResource<VehicleUnassignmentRequestList>(() => {
    const acceptorId = this.acceptorId();
    return this.access.isSae() && acceptorId !== null
      ? `${UNASSIGNMENTS_URL}/acceptor/${acceptorId}`
      : undefined;
  });

  readonly myRequests = computed(() =>
    [...(this.mineResource.value()?.unassignmentRequests ?? [])].sort(byNewestFirst),
  );

  readonly acceptorRequests = computed(() =>
    [...(this.acceptorResource.value()?.unassignmentRequests ?? [])].sort(byNewestFirst),
  );

  readonly pendingAcceptorRequests = computed(() =>
    this.acceptorRequests().filter(isOpenUnassignment),
  );

  readonly reviewedAcceptorRequests = computed(() =>
    this.acceptorRequests().filter((request) => !isOpenUnassignment(request)),
  );

  readonly unassignedVehicles = computed(() =>
    this.myRequests().filter(isApprovedUnassignment),
  );

  readonly latestByVehicle = computed(() => {
    const latest = new Map<number, VehicleUnassignmentRequestDetail>();
    for (const request of this.myRequests()) {
      if (!latest.has(request.idVehicle)) {
        latest.set(request.idVehicle, request);
      }
    }
    return latest;
  });

  readonly isLoading = this.mineResource.isLoading;
  readonly hasFailed = computed(() => this.mineResource.error() !== undefined);

  readonly acceptorIsLoading = computed(() =>
    this.acceptorId() === null
      ? this.currentUserService.isLoading()
      : this.acceptorResource.isLoading(),
  );
  readonly acceptorHasFailed = computed(() => this.acceptorResource.error() !== undefined);

  requestUnassignment(
    vehicleId: number,
    unassignment: VehicleUnassignmentIn,
  ): Observable<VehicleUnassignmentRequestDetail> {
    return this.http
      .post<VehicleUnassignmentRequestDetail>(
        `${VEHICLES_URL}/${vehicleId}/unassignment-requests`,
        unassignment,
      )
      .pipe(tap(() => this.mineResource.reload()));
  }

  respond(
    unassignmentRequestId: number,
    response: ParkingResponseIn,
  ): Observable<VehicleUnassignmentRequestDetail> {
    return this.http
      .patch<VehicleUnassignmentRequestDetail>(
        `${UNASSIGNMENTS_URL}/${unassignmentRequestId}`,
        response,
      )
      .pipe(tap(() => this.acceptorResource.reload()));
  }

  reload(): void {
    this.mineResource.reload();
  }

  reloadAcceptor(): void {
    this.acceptorResource.reload();
  }
}
