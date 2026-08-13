import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import { WorkflowEntry } from '../../../../core/parking/models/parking-request.model';
import { ParkingRequestDetailService } from '../../../../core/parking/parking-request-detail.service';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import {
  isRejected,
  requestOutcome,
  statusTone,
  toDate,
} from '../../../../core/parking/request-status.util';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiDialog } from '../../../../shared/components/ui-dialog/ui-dialog';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { RequestTimeline } from '../../../../shared/components/request-timeline/request-timeline';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

@Component({
  selector: 'app-request-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RequestTimeline,
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
  templateUrl: './request-detail-page.html',
  styleUrl: './request-detail-page.scss',
})
export class RequestDetailPage {
  private readonly parkingRequestService = inject(ParkingRequestService);
  private readonly detailService = inject(ParkingRequestDetailService);
  private readonly formBuilder = inject(FormBuilder);

  readonly requestId = input.required<string>();

  protected readonly request = this.detailService.detail;
  protected readonly isLoading = this.detailService.isLoading;
  protected readonly hasFailed = this.detailService.hasFailed;

  protected readonly dateRequest = computed(() => toDate(this.request()?.dateRequest));
  protected readonly dateResponse = computed(() => toDate(this.request()?.dateResponse));
  protected readonly statusTone = computed(() => {
    const request = this.request();
    return request ? statusTone(request) : 'neutral';
  });
  protected readonly canResubmit = computed(() => {
    const request = this.request();
    return !!request && isRejected(request);
  });
  protected readonly vehicleIcon = computed(() =>
    vehicleIconFor(this.request()?.vehicle.vehicleType),
  );

  protected readonly decision = computed<WorkflowEntry | null>(() => {
    const request = this.request();
    if (!request || requestOutcome(request) === 'pending') {
      return null;
    }

    return (
      [...request.workflow]
        .reverse()
        .find((entry) => entry.status === request.status && entry.observation?.trim()) ?? null
    );
  });

  protected readonly confirming = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly resubmitForm = this.formBuilder.nonNullable.group({
    observation: ['', Validators.maxLength(500)],
  });

  constructor() {
    effect(() => {
      const requestId = Number(this.requestId());
      this.detailService.select(Number.isFinite(requestId) ? requestId : null);
    });
  }

  entryDate(entry: WorkflowEntry): Date | null {
    return toDate(entry.dateStatusChange);
  }

  openResubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.resubmitForm.reset();
    this.confirming.set(true);
  }

  cancelResubmit(): void {
    this.confirming.set(false);
  }

  confirmResubmit(): void {
    const request = this.request();
    if (!request || this.submitting() || this.resubmitForm.invalid) {
      return;
    }

    const observation = this.resubmitForm.getRawValue().observation.trim();

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.parkingRequestService
      .resubmit(request.idRequest, observation ? { observation } : undefined)
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.confirming.set(false);
          this.successMessage.set('Tu solicitud fue reenviada correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.confirming.set(false);
          this.errorMessage.set(apiErrorMessage(error));
        },
      });
  }
}
