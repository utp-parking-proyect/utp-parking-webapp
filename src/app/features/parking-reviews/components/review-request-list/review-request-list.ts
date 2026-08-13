import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { statusTone, toDate } from '../../../../core/parking/request-status.util';
import { vehicleIconFor } from '../../../../core/parking/vehicle-icon.util';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { IconName, UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label-pipe';

@Component({
  selector: 'app-review-request-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, StatusLabelPipe, UiBadge, UiIcon],
  templateUrl: './review-request-list.html',
  styleUrl: './review-request-list.scss',
})
export class ReviewRequestList {
  readonly requests = input.required<readonly ParkingRequestInformation[]>();

  protected readonly statusTone = statusTone;
  protected readonly toDate = toDate;

  vehicleIcon(request: ParkingRequestInformation): IconName {
    return vehicleIconFor(request.vehicle.vehicleType);
  }

  applicantName(request: ParkingRequestInformation): string {
    const { nameApplicant, lastNameApplicant } = request.applicant ?? {};
    return `${nameApplicant ?? ''} ${lastNameApplicant ?? ''}`.trim() || '—';
  }
}
