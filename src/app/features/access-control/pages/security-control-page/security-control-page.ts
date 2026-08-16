import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccessControlService } from '../../../../core/control/access-control.service';
import {
  AccessControlOut,
  AccessControlResult,
} from '../../../../core/control/models/access-control.model';
import {
  AvailabilityTone,
  LocationAvailability,
} from '../../../../core/control/models/parking-availability.model';
import {
  ParkingAvailabilityService,
  availabilityToneFor,
} from '../../../../core/control/parking-availability.service';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { IconName, UiIcon } from '../../../../shared/components/ui-icon/ui-icon';

type Movement = 'entry' | 'exit';

const PLATE_MAX_LENGTH = 8;

const RESULT_ICONS: Readonly<Record<AccessControlResult, IconName>> = {
  ENTRY_REGISTERED: 'check-circle',
  EXIT_REGISTERED: 'check-circle',
  VEHICLE_NOT_FOUND: 'search',
  VEHICLE_UNASSIGNED: 'user-slash',
  REQUEST_NOT_APPROVED: 'alert-circle',
  VEHICLE_ALREADY_INSIDE: 'alert-triangle',
  PARKING_FULL: 'alert-triangle',
  NO_OPEN_RECORD: 'alert-circle',
  RECORD_AT_OTHER_LOCATION: 'alert-triangle',
};

@Component({
  selector: 'app-security-control-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, UiAlert, UiButton, UiCard, UiFormField, UiIcon],
  templateUrl: './security-control-page.html',
  styleUrl: './security-control-page.scss',
})
export class SecurityControlPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly availabilityService = inject(ParkingAvailabilityService);
  private readonly accessControlService = inject(AccessControlService);

  protected readonly locations = this.availabilityService.availability;
  protected readonly locationsLoading = this.availabilityService.isLoading;
  protected readonly locationsFailed = this.availabilityService.hasFailed;
  protected readonly connectionStatus = this.availabilityService.connectionStatus;

  protected readonly plateMaxLength = PLATE_MAX_LENGTH;

  protected readonly form = this.formBuilder.nonNullable.group({
    locationId: this.formBuilder.control<number | null>(null, Validators.required),
    numberPlate: ['', Validators.required],
  });

  protected readonly selectedLocationId = signal<number | null>(null);
  protected readonly submitting = signal<Movement | null>(null);
  protected readonly result = signal<AccessControlOut | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly selectedLocation = computed<LocationAvailability | undefined>(() =>
    this.locations().find((location) => location.locationId === this.selectedLocationId()),
  );

  protected readonly isBusy = computed(() => this.submitting() !== null);

  constructor() {
    this.availabilityService.realtimeUpdates().pipe(takeUntilDestroyed()).subscribe();

    this.form.controls.locationId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((locationId) => this.selectedLocationId.set(locationId));

    effect(() => {
      const [firstLocation] = this.locations();
      if (firstLocation && this.form.controls.locationId.value === null) {
        this.form.controls.locationId.setValue(firstLocation.locationId);
      }
    });
  }

  toneFor(location: LocationAvailability): AvailabilityTone {
    return availabilityToneFor(location);
  }

  resultIcon(result: AccessControlResult): IconName {
    return RESULT_ICONS[result];
  }

  normalizePlate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const plate = input.value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, PLATE_MAX_LENGTH);

    input.value = plate;
    this.form.controls.numberPlate.setValue(plate);
    this.errorMessage.set(null);
  }

  plateError(): string | null {
    const control = this.form.controls.numberPlate;
    return control.invalid && control.touched ? 'Ingresa la placa del vehículo.' : null;
  }

  registerEntry(): void {
    this.submit('entry');
  }

  registerExit(): void {
    this.submit('exit');
  }

  reload(): void {
    this.availabilityService.reload();
  }

  private submit(movement: Movement): void {
    if (this.isBusy()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { locationId, numberPlate } = this.form.getRawValue();
    if (locationId === null) {
      return;
    }

    this.errorMessage.set(null);
    this.result.set(null);
    this.submitting.set(movement);

    const payload = { numberPlate, locationId };
    const request$ =
      movement === 'entry'
        ? this.accessControlService.registerEntry(payload)
        : this.accessControlService.registerExit(payload);

    request$.subscribe({
      next: (result) => {
        this.submitting.set(null);
        this.result.set(result);
        this.form.controls.numberPlate.setValue('');
        this.form.controls.numberPlate.markAsUntouched();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(null);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }
}
