import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { statusTone, toDate } from '../../../../core/parking/request-status.util';
import {
  REVIEW_KIND_ICONS,
  REVIEW_KIND_LABELS,
  ReviewItem,
} from '../../../../core/parking/review-item.util';
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
  readonly items = input.required<readonly ReviewItem[]>();
  readonly showKind = input(false);
  readonly caption = input('Solicitudes asignadas para revisión');

  protected readonly statusTone = statusTone;
  protected readonly toDate = toDate;

  vehicleIcon(item: ReviewItem): IconName {
    return vehicleIconFor(item.vehicleType);
  }

  kindLabel(item: ReviewItem): string {
    return REVIEW_KIND_LABELS[item.kind];
  }

  kindIcon(item: ReviewItem): IconName {
    return REVIEW_KIND_ICONS[item.kind];
  }

  trackBy(_index: number, item: ReviewItem): string {
    return `${item.kind}-${item.id}`;
  }

  detailRoute(item: ReviewItem): unknown[] {
    return item.kind === 'parking'
      ? ['/revisiones', item.id]
      : ['/revisiones-vehiculos', item.id];
  }
}
