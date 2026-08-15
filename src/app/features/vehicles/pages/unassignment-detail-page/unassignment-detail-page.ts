import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkflowEntry } from '../../../../core/parking/models/parking-request.model';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import {
  isRejected,
  requestOutcome,
  statusTone,
  toDate,
} from '../../../../core/parking/request-status.util';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { RequestTimeline } from '../../../../shared/components/request-timeline/request-timeline';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

@Component({
  selector: 'app-unassignment-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RequestTimeline,
    RouterLink,
    StatusLabelPipe,
    UiAlert,
    UiBadge,
    UiButton,
    UiCard,
    UiIcon,
  ],
  templateUrl: './unassignment-detail-page.html',
  styleUrl: './unassignment-detail-page.scss',
})
export class UnassignmentDetailPage {
  private readonly unassignmentService = inject(VehicleUnassignmentService);

  readonly unassignmentId = input.required<string>();

  protected readonly isLoading = this.unassignmentService.isLoading;
  protected readonly hasFailed = this.unassignmentService.hasFailed;

  protected readonly request = computed<VehicleUnassignmentRequestDetail | null>(() => {
    const id = Number(this.unassignmentId());
    if (!Number.isFinite(id)) {
      return null;
    }
    return (
      this.unassignmentService.myRequests().find((item) => item.idUnassignmentRequest === id) ??
      null
    );
  });

  protected readonly notFound = computed(
    () => !this.isLoading() && !this.hasFailed() && this.request() === null,
  );

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

  entryDate(entry: WorkflowEntry): Date | null {
    return toDate(entry.dateStatusChange);
  }

  reload(): void {
    this.unassignmentService.reload();
  }
}
