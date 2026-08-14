import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import {
  canResubmit,
  isRejected,
  statusTone,
  toDate,
} from '../../../../core/parking/request-status.util';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

@Component({
  selector: 'app-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, StatusLabelPipe, UiBadge, UiButton, UiCard, UiIcon],
  templateUrl: './request-card.html',
  styleUrl: './request-card.scss',
})
export class RequestCard {
  readonly request = input.required<ParkingRequestInformation>();
  readonly actionable = input(false);
  readonly resubmitting = input(false);
  readonly currentCycle = input<string | null>(null);

  readonly resubmit = output<ParkingRequestInformation>();

  protected readonly dateRequest = computed(() => toDate(this.request().dateRequest));
  protected readonly dateResponse = computed(() => toDate(this.request().dateResponse));
  protected readonly statusTone = computed(() => statusTone(this.request()));
  protected readonly vehicleIcon = computed(() =>
    vehicleIconFor(this.request().vehicle.vehicleType),
  );
  protected readonly showRejection = computed(
    () => this.actionable() && isRejected(this.request()),
  );
  protected readonly showResubmit = computed(
    () => this.actionable() && canResubmit(this.request(), this.currentCycle()),
  );
}
