import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import { ParkingRequestIn } from '../../../../core/parking/models/parking-request.model';
import { VehicleDetail } from '../../../../core/parking/models/vehicle.model';
import {
  PLATE_MAX_LENGTH,
  formatPlate,
  isValidPlate,
  plateErrorFor,
  plateExampleFor,
} from '../../../../core/parking/number-plate.util';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { VEHICLE_TYPES } from '../../../../core/parking/parking.constants';
import { VehicleService } from '../../../../core/parking/vehicle.service';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { RequestCard } from '../../components/request-card/request-card';

type FormStep = 'loading' | 'limit-reached' | 'select' | 'empty' | 'new-vehicle';

const plateFormatValidator: ValidatorFn = (control) => {
  const plate = control.value as string;
  const idVehicleType = control.parent?.get('vehicleType')?.value as number | null;

  if (!plate || idVehicleType === null || idVehicleType === undefined) {
    return null;
  }

  return isValidPlate(plate, idVehicleType) ? null : { plateFormat: true };
};

@Component({
  selector: 'app-new-request-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RequestCard,
    UiAlert,
    UiBadge,
    UiButton,
    UiCard,
    UiFormField,
    UiIcon,
  ],
  templateUrl: './new-request-page.html',
  styleUrl: './new-request-page.scss',
})
export class NewRequestPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly parkingRequestService = inject(ParkingRequestService);
  private readonly vehicleService = inject(VehicleService);

  protected readonly vehicleTypes = VEHICLE_TYPES;
  protected readonly vehicles = this.vehicleService.vehicles;
  protected readonly vehiclesLoading = this.vehicleService.isLoading;
  protected readonly vehiclesFailed = this.vehicleService.hasFailed;
  protected readonly vehiclesLimitReached = this.vehicleService.hasReachedLimit;
  protected readonly maxAssignedVehicles = this.vehicleService.maxAssignedVehicles;

  protected readonly maxRequestsPerCycle = this.parkingRequestService.maxRequestsPerCycle;
  protected readonly cycleRequests = computed(
    () => this.parkingRequestService.currentCycleRequests().length,
  );
  protected readonly cycleLimitReached = this.parkingRequestService.hasReachedCycleLimit;
  private readonly requestsLoading = this.parkingRequestService.isLoading;

  protected readonly existingForm = this.formBuilder.nonNullable.group({
    numberPlate: ['', Validators.required],
  });

  protected readonly newVehicleForm = this.formBuilder.group({
    vehicleType: this.formBuilder.control<number | null>(null, Validators.required),
    numberPlate: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(PLATE_MAX_LENGTH),
      plateFormatValidator,
    ]),
  });

  private readonly selectedVehicleType = toSignal(
    this.newVehicleForm.controls.vehicleType.valueChanges,
    { initialValue: this.newVehicleForm.controls.vehicleType.value },
  );

  protected readonly plateExample = computed(() => plateExampleFor(this.selectedVehicleType()));
  protected readonly plateMaxLength = PLATE_MAX_LENGTH;

  protected readonly vehicleIcon = computed(() =>
    vehicleIconFor(
      VEHICLE_TYPES.find((type) => type.idVehicleType === this.selectedVehicleType())?.name,
    ),
  );

  private readonly registeringNewVehicle = signal(false);

  protected readonly createdRequestId = signal<number | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submittedPlate = signal<string | null>(null);

  private readonly selectedPlate = toSignal(this.existingForm.controls.numberPlate.valueChanges, {
    initialValue: this.existingForm.controls.numberPlate.value,
  });

  protected readonly selectedVehicle = computed(() =>
    this.vehicles().find((vehicle) => vehicle.numberPlate === this.selectedPlate()),
  );

  protected readonly step = computed<FormStep>(() => {
    if (this.vehiclesLoading() || this.requestsLoading()) {
      return 'loading';
    }
    if (this.cycleLimitReached()) {
      return 'limit-reached';
    }
    if (this.registeringNewVehicle() || this.vehiclesFailed()) {
      return 'new-vehicle';
    }
    return this.vehicles().length > 0 ? 'select' : 'empty';
  });

  protected readonly isRegistered = computed(() => this.createdRequestId() !== null);

  protected readonly createdRequest = computed(() => {
    const createdId = this.createdRequestId();
    return createdId === null
      ? undefined
      : this.parkingRequestService.requests().find((request) => request.idRequest === createdId);
  });

  constructor() {
    effect(() => {
      const [firstVehicle] = this.vehicles();
      const control = this.existingForm.controls.numberPlate;

      if (firstVehicle && !control.value) {
        control.setValue(firstVehicle.numberPlate);
      }
    });

    this.newVehicleForm.controls.vehicleType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((idVehicleType) => {
        const control = this.newVehicleForm.controls.numberPlate;
        control.setValue(formatPlate(control.value, idVehicleType), { emitEvent: false });
        control.updateValueAndValidity({ emitEvent: false });
      });
  }

  iconFor(vehicle: VehicleDetail): ReturnType<typeof vehicleIconFor> {
    return vehicleIconFor(vehicle.vehicleType);
  }

  errorFor(
    control: FormControl<string> | FormControl<number | null>,
    message: string,
  ): string | null {
    return control.invalid && control.touched ? message : null;
  }

  plateError(): string | null {
    const control = this.newVehicleForm.controls.numberPlate;
    if (control.valid || !control.touched) {
      return null;
    }
    return control.hasError('plateFormat')
      ? plateErrorFor(this.newVehicleForm.controls.vehicleType.value)
      : 'Ingresa la placa de tu vehículo.';
  }

  registerNewVehicle(): void {
    this.errorMessage.set(null);
    this.registeringNewVehicle.set(true);
  }

  useRegisteredVehicle(): void {
    this.errorMessage.set(null);
    this.registeringNewVehicle.set(false);
  }

  normalizePlate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const plate = formatPlate(input.value, this.newVehicleForm.controls.vehicleType.value);

    input.value = plate;
    this.newVehicleForm.controls.numberPlate.setValue(plate);
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.submitting() || this.cycleLimitReached()) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.parkingRequestService.create(payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.submittedPlate.set(payload.numberPlate);
        this.createdRequestId.set(response.parkingRequestId);
        this.parkingRequestService.reload();
        this.vehicleService.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  private buildPayload(): ParkingRequestIn | null {
    if (this.step() === 'select') {
      if (this.existingForm.invalid) {
        this.existingForm.markAllAsTouched();
        return null;
      }
      return { numberPlate: this.existingForm.getRawValue().numberPlate };
    }

    if (this.newVehicleForm.invalid) {
      this.newVehicleForm.markAllAsTouched();
      return null;
    }

    const { numberPlate, vehicleType } = this.newVehicleForm.getRawValue();
    return vehicleType === null ? null : { numberPlate, vehicleType };
  }
}
