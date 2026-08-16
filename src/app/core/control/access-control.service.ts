import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PARKING_ENTRY_PATH, PARKING_EXIT_PATH } from './control.constants';
import { AccessControlIn, AccessControlOut } from './models/access-control.model';
import { ParkingAvailabilityService } from './parking-availability.service';

const ENTRY_URL = `${environment.gatewayUrl}${PARKING_ENTRY_PATH}`;
const EXIT_URL = `${environment.gatewayUrl}${PARKING_EXIT_PATH}`;

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly http = inject(HttpClient);
  private readonly availabilityService = inject(ParkingAvailabilityService);

  registerEntry(movement: AccessControlIn): Observable<AccessControlOut> {
    return this.http.post<AccessControlOut>(ENTRY_URL, movement).pipe(tap(this.applyAvailability));
  }

  registerExit(movement: AccessControlIn): Observable<AccessControlOut> {
    return this.http.post<AccessControlOut>(EXIT_URL, movement).pipe(tap(this.applyAvailability));
  }

  private readonly applyAvailability = (result: AccessControlOut): void => {
    this.availabilityService.applyAvailability(result.availability);
  };
}
