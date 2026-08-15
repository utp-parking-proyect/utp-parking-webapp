import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { VehicleDetail, VehicleDetailList, VehicleIn } from './models/vehicle.model';
import { PARKING_VEHICLE_PATH } from './parking.constants';

const VEHICLES_URL = `${environment.gatewayUrl}${PARKING_VEHICLE_PATH}`;

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly resource = httpResource<VehicleDetailList>(() =>
    this.authService.isAuthenticated() ? `${VEHICLES_URL}/me` : undefined,
  );

  readonly vehicles = computed<VehicleDetail[]>(() => this.resource.value()?.vehicles ?? []);
  readonly assignedVehicleCount = computed(
    () => this.resource.value()?.assignedVehicles ?? this.vehicles().length,
  );
  readonly maxAssignedVehicles = computed(() => this.resource.value()?.maxAssignedVehicles ?? null);
  readonly hasReachedLimit = computed(() => {
    const maxAssignedVehicles = this.maxAssignedVehicles();
    return maxAssignedVehicles !== null && this.assignedVehicleCount() >= maxAssignedVehicles;
  });

  readonly isLoading = this.resource.isLoading;
  readonly hasFailed = computed(() => this.resource.error() !== undefined);

  register(vehicle: VehicleIn): Observable<VehicleDetail> {
    return this.http
      .post<VehicleDetail>(VEHICLES_URL, vehicle)
      .pipe(tap(() => this.resource.reload()));
  }

  reload(): void {
    this.resource.reload();
  }
}
