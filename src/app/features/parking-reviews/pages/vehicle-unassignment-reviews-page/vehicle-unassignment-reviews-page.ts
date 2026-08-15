import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../../../core/parking/api-error.util';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiDialog } from '../../../../shared/components/ui-dialog/ui-dialog';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

type ReviewsView = 'pendientes' | 'revisadas';

@Component({
  selector: 'app-vehicle-unassignment-reviews-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    StatusLabelPipe,
    UiAlert,
    UiBadge,
    UiButton,
    UiCard,
    UiDialog,
    UiFormField,
    UiIcon,
  ],
  templateUrl: './vehicle-unassignment-reviews-page.html',
  styleUrl: './vehicle-unassignment-reviews-page.scss',
})
export class VehicleUnassignmentReviewsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly unassignmentService = inject(VehicleUnassignmentService);

  protected readonly isLoading = this.unassignmentService.acceptorIsLoading;
  protected readonly hasFailed = this.unassignmentService.acceptorHasFailed;

  protected readonly view = signal<ReviewsView>('pendientes');

  protected readonly pendingRequests = this.unassignmentService.pendingAcceptorRequests;
  protected readonly reviewedRequests = this.unassignmentService.reviewedAcceptorRequests;

  protected readonly visibleRequests = computed(() =>
    this.view() === 'revisadas' ? this.reviewedRequests() : this.pendingRequests(),
  );

  protected readonly approveTarget = signal<VehicleUnassignmentRequestDetail | null>(null);
  protected readonly rejectTarget = signal<VehicleUnassignmentRequestDetail | null>(null);
  protected readonly responding = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly rejectForm = this.formBuilder.nonNullable.group({
    comment: ['', [Validators.required, Validators.maxLength(500)]],
  });

  setView(view: ReviewsView): void {
    this.view.set(view);
  }

  applicantName(request: VehicleUnassignmentRequestDetail): string {
    const { nameApplicant, lastNameApplicant } = request.applicant ?? {};
    return [nameApplicant, lastNameApplicant].filter(Boolean).join(' ');
  }

  askApprove(request: VehicleUnassignmentRequestDetail): void {
    if (this.responding()) {
      return;
    }
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.approveTarget.set(request);
  }

  cancelApprove(): void {
    if (this.responding()) {
      return;
    }
    this.approveTarget.set(null);
  }

  askReject(request: VehicleUnassignmentRequestDetail): void {
    if (this.responding()) {
      return;
    }
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.rejectForm.reset({ comment: '' });
    this.rejectTarget.set(request);
  }

  cancelReject(): void {
    if (this.responding()) {
      return;
    }
    this.rejectTarget.set(null);
  }

  commentError(): string | null {
    const control = this.rejectForm.controls.comment;
    return control.invalid && control.touched ? 'Indica el motivo del rechazo.' : null;
  }

  confirmApprove(): void {
    const request = this.approveTarget();
    if (!request || this.responding()) {
      return;
    }
    this.respond(request, { approved: true }, `desasignado`);
  }

  confirmReject(): void {
    const request = this.rejectTarget();
    if (!request || this.responding()) {
      return;
    }

    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    this.respond(
      request,
      { approved: false, comment: this.rejectForm.getRawValue().comment },
      'rechazada',
    );
  }

  private respond(
    request: VehicleUnassignmentRequestDetail,
    response: { approved: boolean; comment?: string },
    outcome: string,
  ): void {
    this.errorMessage.set(null);
    this.responding.set(true);

    this.unassignmentService.respond(request.idUnassignmentRequest, response).subscribe({
      next: () => {
        this.responding.set(false);
        this.approveTarget.set(null);
        this.rejectTarget.set(null);
        this.successMessage.set(
          response.approved
            ? `El vehículo ${request.vehicle.numberPlate} fue ${outcome} correctamente.`
            : `La solicitud de desasignación del vehículo ${request.vehicle.numberPlate} fue ${outcome}.`,
        );
      },
      error: (error: HttpErrorResponse) => {
        this.responding.set(false);
        this.approveTarget.set(null);
        this.rejectTarget.set(null);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  reload(): void {
    this.unassignmentService.reloadAcceptor();
  }
}
