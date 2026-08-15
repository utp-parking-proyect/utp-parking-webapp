import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import {
  ParkingResponseIn,
  WorkflowEntry,
} from '../../../../core/parking/models/parking-request.model';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import {
  isRejected,
  requestOutcome,
  statusTone,
  toDate,
} from '../../../../core/parking/request-status.util';
import {
  VehicleUnassignmentService,
  isOpenUnassignment,
} from '../../../../core/parking/vehicle-unassignment.service';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { RequestTimeline } from '../../../../shared/components/request-timeline/request-timeline';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiDialog } from '../../../../shared/components/ui-dialog/ui-dialog';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

export type UnassignmentDetailMode = 'mine' | 'review';

type ReviewAction = 'approve' | 'reject';

@Component({
  selector: 'app-unassignment-detail-page',
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
    UserAvatar,
  ],
  templateUrl: './unassignment-detail-page.html',
  styleUrl: './unassignment-detail-page.scss',
})
export class UnassignmentDetailPage {
  private readonly unassignmentService = inject(VehicleUnassignmentService);
  private readonly parkingReviewService = inject(ParkingReviewService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly unassignmentId = input.required<string>();
  readonly mode = input<UnassignmentDetailMode>('mine');

  protected readonly isReview = computed(() => this.mode() === 'review');

  protected readonly isLoading = computed(() =>
    this.isReview()
      ? this.unassignmentService.acceptorIsLoading()
      : this.unassignmentService.isLoading(),
  );

  protected readonly hasFailed = computed(() =>
    this.isReview()
      ? this.unassignmentService.acceptorHasFailed()
      : this.unassignmentService.hasFailed(),
  );

  protected readonly request = computed<VehicleUnassignmentRequestDetail | null>(() => {
    const id = Number(this.unassignmentId());
    if (!Number.isFinite(id)) {
      return null;
    }
    const source = this.isReview()
      ? this.unassignmentService.acceptorRequests()
      : this.unassignmentService.myRequests();
    return source.find((item) => item.idUnassignmentRequest === id) ?? null;
  });

  protected readonly notFound = computed(
    () => !this.isLoading() && !this.hasFailed() && this.request() === null,
  );

  protected readonly backRoute = computed(() =>
    this.isReview() ? '/revisiones-vehiculos' : '/solicitudes',
  );

  protected readonly backLabel = computed(() =>
    this.isReview() ? 'Volver a desasignaciones' : 'Volver a mis solicitudes',
  );

  protected readonly applicantProfile = this.parkingReviewService.applicantProfile;
  protected readonly applicantFailed = this.parkingReviewService.applicantFailed;

  protected readonly applicantName = computed(() => {
    const applicant = this.request()?.applicant;
    return [applicant?.nameApplicant, applicant?.lastNameApplicant].filter(Boolean).join(' ').trim();
  });

  protected readonly dateRequest = computed(() => toDate(this.request()?.dateRequest));
  protected readonly dateResponse = computed(() => toDate(this.request()?.dateResponse));

  protected readonly statusTone = computed(() => {
    const request = this.request();
    return request ? statusTone(request) : 'neutral';
  });

  protected readonly isRejected = computed(() => {
    const request = this.request();
    return !!request && isRejected(request);
  });

  protected readonly canRespond = computed(() => {
    const request = this.request();
    return this.isReview() && !!request && isOpenUnassignment(request);
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

  protected readonly action = signal<ReviewAction | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly rejectionForm = this.formBuilder.nonNullable.group({
    comment: ['', [Validators.required, Validators.maxLength(500)]],
  });


  constructor() {
    effect(() => {
      const idApplicant = this.isReview() ? (this.request()?.applicant?.idApplicant ?? null) : null;
      this.parkingReviewService.selectApplicant(idApplicant);
    });
  }

  entryDate(entry: WorkflowEntry): Date | null {
    return toDate(entry.dateStatusChange);
  }

  commentError(): string | null {
    const control = this.rejectionForm.controls.comment;
    return control.invalid && control.touched ? 'Indica el motivo del rechazo.' : null;
  }

  openAccept(): void {
    this.errorMessage.set(null);
    this.action.set('approve');
  }

  openReject(): void {
    this.errorMessage.set(null);
    this.rejectionForm.reset();
    this.action.set('reject');
  }

  closeDialog(): void {
    if (this.submitting()) {
      return;
    }
    this.action.set(null);
  }

  confirmAccept(): void {
    this.submit(true);
  }

  confirmReject(): void {
    if (this.rejectionForm.invalid) {
      this.rejectionForm.markAllAsTouched();
      return;
    }
    this.submit(false, this.rejectionForm.getRawValue().comment.trim());
  }

  private submit(approved: boolean, comment?: string): void {
    const request = this.request();
    if (!request || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload: ParkingResponseIn = comment ? { approved, comment } : { approved };

    this.unassignmentService.respond(request.idUnassignmentRequest, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.action.set(null);
        this.router.navigate(['/revisiones-vehiculos'], {
          queryParams: {
            respondida: request.idUnassignmentRequest,
            resultado: approved ? 'aceptada' : 'rechazada',
            placa: request.vehicle.numberPlate,
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.action.set(null);
        this.errorMessage.set(apiErrorMessage(error));
        this.unassignmentService.reloadAcceptor();
      },
    });
  }

  reload(): void {
    if (this.isReview()) {
      this.unassignmentService.reloadAcceptor();
      return;
    }
    this.unassignmentService.reload();
  }
}
