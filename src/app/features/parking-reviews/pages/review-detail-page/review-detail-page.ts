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
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import {
  ParkingResponseIn,
  WorkflowEntry,
} from '../../../../core/parking/models/parking-request.model';
import { ParkingRequestDetailService } from '../../../../core/parking/parking-request-detail.service';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { isPendingReview, statusTone, toDate } from '../../../../core/parking/request-status.util';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiDialog } from '../../../../shared/components/ui-dialog/ui-dialog';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { RequestTimeline } from '../../../../shared/components/request-timeline/request-timeline';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

type ReviewAction = 'approve' | 'reject';

function isResubmission(status: string): boolean {
  return status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .includes('reenv');
}

@Component({
  selector: 'app-review-detail-page',
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
  templateUrl: './review-detail-page.html',
  styleUrl: './review-detail-page.scss',
})
export class ReviewDetailPage {
  private readonly parkingReviewService = inject(ParkingReviewService);
  private readonly detailService = inject(ParkingRequestDetailService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly requestId = input.required<string>();

  protected readonly request = this.detailService.detail;
  protected readonly isLoading = this.detailService.isLoading;
  protected readonly hasFailed = this.detailService.hasFailed;

  protected readonly applicantProfile = this.parkingReviewService.applicantProfile;
  protected readonly applicantFailed = this.parkingReviewService.applicantFailed;

  protected readonly timeline = computed(() => [...(this.request()?.workflow ?? [])].reverse());

  protected readonly applicantNote = computed(
    () =>
      this.timeline().find((entry) => isResubmission(entry.status) && entry.observation?.trim()) ??
      null,
  );

  protected readonly dateRequest = computed(() => toDate(this.request()?.dateRequest));
  protected readonly dateResponse = computed(() => toDate(this.request()?.dateResponse));
  protected readonly statusTone = computed(() => {
    const request = this.request();
    return request ? statusTone(request) : 'neutral';
  });
  protected readonly canRespond = computed(() => {
    const request = this.request();
    return !!request && isPendingReview(request);
  });
  protected readonly vehicleIcon = computed(() =>
    vehicleIconFor(this.request()?.vehicle.vehicleType),
  );

  protected readonly action = signal<ReviewAction | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly rejectionForm = this.formBuilder.nonNullable.group({
    comment: ['', [Validators.required, Validators.maxLength(500)]],
  });

  protected readonly commentError = computed(() =>
    this.rejectionForm.controls.comment.invalid && this.rejectionForm.controls.comment.touched
      ? 'Indica el motivo del rechazo.'
      : null,
  );

  constructor() {
    effect(() => {
      const requestId = Number(this.requestId());
      this.detailService.select(Number.isFinite(requestId) ? requestId : null);
    });

    effect(() =>
      this.parkingReviewService.selectApplicant(this.request()?.applicant?.idApplicant ?? null),
    );
  }

  entryDate(entry: WorkflowEntry): Date | null {
    return toDate(entry.dateStatusChange);
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

    this.parkingReviewService.respond(request.idRequest, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.action.set(null);
        this.router.navigate(['/revisiones'], {
          queryParams: {
            respondida: request.idRequest,
            resultado: approved ? 'aceptada' : 'rechazada',
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.action.set(null);
        this.errorMessage.set(apiErrorMessage(error));
        this.parkingReviewService.reload();
      },
    });
  }
}
