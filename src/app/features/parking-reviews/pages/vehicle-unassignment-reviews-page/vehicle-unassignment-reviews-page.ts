import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { statusTone } from '../../../../core/parking/request-status.util';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

@Component({
  selector: 'app-vehicle-unassignment-reviews-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusLabelPipe, UiAlert, UiBadge, UiButton, UiCard, UiIcon],
  templateUrl: './vehicle-unassignment-reviews-page.html',
  styleUrl: './vehicle-unassignment-reviews-page.scss',
})
export class VehicleUnassignmentReviewsPage {
  private readonly unassignmentService = inject(VehicleUnassignmentService);

  readonly respondida = input<string>();
  readonly resultado = input<string>();
  readonly placa = input<string>();

  protected readonly isLoading = this.unassignmentService.acceptorIsLoading;
  protected readonly hasFailed = this.unassignmentService.acceptorHasFailed;

  protected readonly pendingRequests = this.unassignmentService.pendingAcceptorRequests;
  protected readonly statusTone = statusTone;

  protected readonly feedback = computed(() => {
    const requestId = this.respondida();
    if (!requestId) {
      return null;
    }

    const plate = this.placa();
    const vehicle = plate ? ` del vehículo ${plate}` : '';

    return this.resultado() === 'rechazada'
      ? `La solicitud de desasignación #${requestId}${vehicle} fue rechazada. El vehículo sigue asignado al solicitante.`
      : `La solicitud de desasignación #${requestId}${vehicle} fue aceptada. El vehículo dejó de estar asignado.`;
  });

  applicantName(request: VehicleUnassignmentRequestDetail): string {
    const { nameApplicant, lastNameApplicant } = request.applicant ?? {};
    return [nameApplicant, lastNameApplicant].filter(Boolean).join(' ');
  }

  reload(): void {
    this.unassignmentService.reloadAcceptor();
  }
}
