import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { isRejected, statusTone, toDate } from '../../../../core/parking/request-status.util';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

@Component({
  selector: 'app-unassignment-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, StatusLabelPipe, UiBadge, UiCard, UiIcon],
  templateUrl: './unassignment-request-card.html',
  styleUrl: './unassignment-request-card.scss',
})
export class UnassignmentRequestCard {
  readonly request = input.required<VehicleUnassignmentRequestDetail>();

  protected readonly dateRequest = computed(() => toDate(this.request().dateRequest));
  protected readonly dateResponse = computed(() => toDate(this.request().dateResponse));
  protected readonly statusTone = computed(() => statusTone(this.request()));
  protected readonly vehicleIcon = computed(() =>
    vehicleIconFor(this.request().vehicle.vehicleType),
  );
  protected readonly rejectionReason = computed(() => {
    if (!isRejected(this.request())) {
      return null;
    }
    const workflow = this.request().workflow ?? [];
    return workflow[workflow.length - 1]?.observation ?? null;
  });
}
