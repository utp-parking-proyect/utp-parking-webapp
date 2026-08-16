import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {
  AVAILABILITY_LOW_RATIO,
  AVAILABILITY_MEDIUM_RATIO,
  PARKING_AVAILABILITY_PATH,
} from './control.constants';
import {
  AvailabilityTone,
  CampusAvailability,
  LocationAvailability,
  ParkingAvailabilityList,
} from './models/parking-availability.model';
import { ParkingControlRealtimeService } from './parking-control-realtime.service';

const AVAILABILITY_URL = `${environment.gatewayUrl}${PARKING_AVAILABILITY_PATH}`;

const UNGROUPED_CAMPUS_NAME = 'Otras sedes';

export function availabilityToneFor(location: LocationAvailability): AvailabilityTone {
  if (location.available <= 0) {
    return 'full';
  }
  if (location.capacity <= 0) {
    return 'free';
  }

  const ratio = location.available / location.capacity;
  if (ratio <= AVAILABILITY_LOW_RATIO) {
    return 'low';
  }
  return ratio <= AVAILABILITY_MEDIUM_RATIO ? 'medium' : 'free';
}

@Injectable({ providedIn: 'root' })
export class ParkingAvailabilityService {
  private readonly authService = inject(AuthService);
  private readonly realtimeService = inject(ParkingControlRealtimeService);

  private readonly resource = httpResource<ParkingAvailabilityList>(() =>
    this.authService.isAuthenticated() ? AVAILABILITY_URL : undefined,
  );

  private readonly liveUpdates = signal<ReadonlyMap<number, LocationAvailability>>(new Map());

  readonly availability = computed<LocationAvailability[]>(() => {
    const initial = this.resource.value()?.availability ?? [];
    const updates = this.liveUpdates();

    const merged = initial.map((location) => updates.get(location.locationId) ?? location);
    const knownIds = new Set(merged.map((location) => location.locationId));
    const unknown = [...updates.values()].filter((location) => !knownIds.has(location.locationId));

    return [...merged, ...unknown].sort((a, b) => a.locationId - b.locationId);
  });

  readonly campuses = computed<CampusAvailability[]>(() => {
    const groups = new Map<number | null, CampusAvailability>();

    for (const location of this.availability()) {
      const key = location.campusId ?? null;
      const group = groups.get(key) ?? {
        campusId: key,
        campusName: location.campusName ?? UNGROUPED_CAMPUS_NAME,
        locations: [],
        capacity: 0,
        occupied: 0,
        available: 0,
      };

      group.locations = [...group.locations, location];
      group.capacity += location.capacity;
      group.occupied += location.occupied;
      group.available += location.available;
      groups.set(key, group);
    }

    return [...groups.values()];
  });

  readonly totalAvailable = computed(() =>
    this.availability().reduce((total, location) => total + location.available, 0),
  );

  readonly isLoading = this.resource.isLoading;
  readonly hasFailed = computed(() => this.resource.error() !== undefined);
  readonly connectionStatus = this.realtimeService.status;

  realtimeUpdates(): Observable<LocationAvailability> {
    return this.realtimeService.availabilityChanges.pipe(
      tap((availability) => this.applyAvailability(availability)),
    );
  }

  applyAvailability(availability: LocationAvailability | null): void {
    if (!availability) {
      return;
    }

    this.liveUpdates.update((updates) => {
      const next = new Map(updates);
      next.set(availability.locationId, availability);
      return next;
    });
  }

  locationById(locationId: number | null): LocationAvailability | undefined {
    return this.availability().find((location) => location.locationId === locationId);
  }

  reload(): void {
    this.resource.reload();
  }
}
