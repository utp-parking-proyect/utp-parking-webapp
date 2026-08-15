import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import {
  VehicleDetail,
  VehicleUnassignmentRequestDetail,
} from '../../../../core/parking/models/vehicle.model';
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
import {
  VehicleUnassignmentService,
  isOpenUnassignment,
  isRejectedUnassignment,
} from '../../../../core/parking/vehicle-unassignment.service';
import {
  UNKNOWN_VEHICLE_ACCESS,
  VehicleAccess,
  vehicleAccessFor,
  vehicleAccessIcon,
  vehicleAccessLabel,
  vehicleAccessTone,
} from '../../../../core/parking/vehicle-access.util';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiDialog } from '../../../../shared/components/ui-dialog/ui-dialog';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

const plateFormatValidator: ValidatorFn = (control) => {
  const plate = control.value as string;
  const idVehicleType = control.parent?.get('vehicleType')?.value as number | null;

  if (!plate || idVehicleType === null || idVehicleType === undefined) {
    return null;
  }

  return isValidPlate(plate, idVehicleType) ? null : { plateFormat: true };
};

@Component({
  selector: 'app-my-vehicles-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    StatusLabelPipe,
    UiAlert,
    UiBadge,
    UiButton,
    UiCard,
    UiDialog,
    UiFormField,
    UiIcon,
  ],
  templateUrl: './my-vehicles-page.html',
  styleUrl: './my-vehicles-page.scss',
})
export class MyVehiclesPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly vehicleService = inject(VehicleService);
  private readonly parkingRequestService = inject(ParkingRequestService);
  private readonly currentCycleService = inject(CurrentCycleService);
  private readonly unassignmentService = inject(VehicleUnassignmentService);

  protected readonly vehicleTypes = VEHICLE_TYPES;
  protected readonly vehicles = this.vehicleService.vehicles;
  protected readonly assignedVehicleCount = this.vehicleService.assignedVehicleCount;
  protected readonly maxAssignedVehicles = this.vehicleService.maxAssignedVehicles;
  protected readonly hasReachedLimit = this.vehicleService.hasReachedLimit;
  protected readonly isLoading = this.vehicleService.isLoading;
  protected readonly hasFailed = this.vehicleService.hasFailed;

  protected readonly currentCycleName = this.currentCycleService.name;
  protected readonly accessUnavailable = computed(
    () =>
      this.parkingRequestService.hasFailed() ||
      this.currentCycleService.hasFailed() ||
      this.currentCycleName() === null,
  );

  private readonly accessByVehicle = computed(() => {
    const requests = this.parkingRequestService.requests();
    const cycleName = this.accessUnavailable() ? null : this.currentCycleName();

    return new Map(
      this.vehicles().map((vehicle) => [
        vehicle.idVehicle,
        vehicleAccessFor(vehicle, requests, cycleName),
      ]),
    );
  });

  protected readonly plateMaxLength = PLATE_MAX_LENGTH;

  protected readonly registering = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    vehicleType: this.formBuilder.control<number | null>(null, Validators.required),
    numberPlate: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(PLATE_MAX_LENGTH),
      plateFormatValidator,
    ]),
  });

  private readonly selectedVehicleType = toSignal(this.form.controls.vehicleType.valueChanges, {
    initialValue: this.form.controls.vehicleType.value,
  });

  protected readonly plateExample = computed(() => plateExampleFor(this.selectedVehicleType()));
  protected readonly newVehicleIcon = computed(() =>
    vehicleIconFor(
      VEHICLE_TYPES.find((type) => type.idVehicleType === this.selectedVehicleType())?.name,
    ),
  );

  protected readonly unassignTarget = signal<VehicleDetail | null>(null);
  protected readonly unassigning = signal(false);

  protected readonly cycleRequests = computed(
    () => this.parkingRequestService.currentCycleRequests().length,
  );
  protected readonly maxRequestsPerCycle = this.parkingRequestService.maxRequestsPerCycle;

  protected readonly unassignTargetIsAuthorized = computed(() => {
    const target = this.unassignTarget();
    return target !== null && this.accessFor(target).status === 'allowed';
  });

  protected readonly unassignForm = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(255)]],
  });

  private readonly unassignmentByVehicle = this.unassignmentService.latestByVehicle;

  protected readonly unassignedHistory = this.unassignmentService.unassignedVehicles;

  unassignmentFor(vehicle: VehicleDetail): VehicleUnassignmentRequestDetail | null {
    return this.unassignmentByVehicle().get(vehicle.idVehicle) ?? null;
  }

  hasOpenUnassignment(vehicle: VehicleDetail): boolean {
    const unassignment = this.unassignmentFor(vehicle);
    return unassignment !== null && isOpenUnassignment(unassignment);
  }

  rejectedUnassignmentFor(vehicle: VehicleDetail): VehicleUnassignmentRequestDetail | null {
    const unassignment = this.unassignmentFor(vehicle);
    return unassignment !== null && isRejectedUnassignment(unassignment) ? unassignment : null;
  }

  rejectionReasonFor(vehicle: VehicleDetail): string | null {
    const rejected = this.rejectedUnassignmentFor(vehicle);
    if (rejected === null) {
      return null;
    }
    const lastEntry = rejected.workflow[rejected.workflow.length - 1];
    return lastEntry?.observation ?? null;
  }

  askUnassignment(vehicle: VehicleDetail): void {
    if (this.unassigning() || this.hasOpenUnassignment(vehicle)) {
      return;
    }
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.unassignForm.reset({ reason: '' });
    this.unassignTarget.set(vehicle);
  }

  cancelUnassignment(): void {
    if (this.unassigning()) {
      return;
    }
    this.unassignTarget.set(null);
  }

  unassignReasonError(): string | null {
    const control = this.unassignForm.controls.reason;
    if (control.valid || !control.touched) {
      return null;
    }
    return 'Indica el motivo de la desasignación.';
  }

  confirmUnassignment(): void {
    const vehicle = this.unassignTarget();
    if (!vehicle || this.unassigning()) {
      return;
    }

    if (this.unassignForm.invalid) {
      this.unassignForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.unassigning.set(true);

    this.unassignmentService
      .requestUnassignment(vehicle.idVehicle, { reason: this.unassignForm.getRawValue().reason })
      .subscribe({
        next: () => {
          this.unassigning.set(false);
          this.unassignTarget.set(null);
          this.successMessage.set(
            `Enviamos tu solicitud de desasignación del vehículo ${vehicle.numberPlate}. El personal SAE la revisará.`,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.unassigning.set(false);
          this.errorMessage.set(apiErrorMessage(error));
        },
      });
  }

  constructor() {
    this.form.controls.vehicleType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((idVehicleType) => {
        const control = this.form.controls.numberPlate;
        control.setValue(formatPlate(control.value, idVehicleType), { emitEvent: false });
        control.updateValueAndValidity({ emitEvent: false });
      });
  }

  iconFor(vehicle: VehicleDetail): ReturnType<typeof vehicleIconFor> {
    return vehicleIconFor(vehicle.vehicleType);
  }

  accessFor(vehicle: VehicleDetail): VehicleAccess {
    return this.accessByVehicle().get(vehicle.idVehicle) ?? UNKNOWN_VEHICLE_ACCESS;
  }

  accessLabel(access: VehicleAccess): string {
    return vehicleAccessLabel(access);
  }

  accessTone(access: VehicleAccess): ReturnType<typeof vehicleAccessTone> {
    return vehicleAccessTone(access);
  }

  accessIcon(access: VehicleAccess): ReturnType<typeof vehicleAccessIcon> {
    return vehicleAccessIcon(access);
  }

  errorFor(message: string): string | null {
    const control = this.form.controls.vehicleType;
    return control.invalid && control.touched ? message : null;
  }

  plateError(): string | null {
    const control = this.form.controls.numberPlate;
    if (control.valid || !control.touched) {
      return null;
    }
    return control.hasError('plateFormat')
      ? plateErrorFor(this.form.controls.vehicleType.value)
      : 'Ingresa la placa de tu vehículo.';
  }

  normalizePlate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const plate = formatPlate(input.value, this.form.controls.vehicleType.value);

    input.value = plate;
    this.form.controls.numberPlate.setValue(plate);
    this.errorMessage.set(null);
  }

  openForm(): void {
    if (this.hasReachedLimit()) {
      return;
    }
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.form.reset({ vehicleType: null, numberPlate: '' });
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (this.registering()) {
      return;
    }
    this.formOpen.set(false);
  }

  submit(): void {
    if (this.registering() || this.hasReachedLimit()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { numberPlate, vehicleType } = this.form.getRawValue();
    if (vehicleType === null) {
      return;
    }

    this.errorMessage.set(null);
    this.registering.set(true);

    this.vehicleService.register({ numberPlate, vehicleType }).subscribe({
      next: (vehicle) => {
        this.registering.set(false);
        this.formOpen.set(false);
        this.successMessage.set(`El vehículo ${vehicle.numberPlate} fue registrado correctamente.`);
      },
      error: (error: HttpErrorResponse) => {
        this.registering.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  reload(): void {
    this.vehicleService.reload();
    this.parkingRequestService.reload();
    this.currentCycleService.reload();
    this.unassignmentService.reload();
  }
}
