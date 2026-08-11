import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { BadgeTone, UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';

function normalize(status: string): string {
  return status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * DatePipe lanza NG02100 ante un valor no convertible y eso aborta el render de toda la tarjeta.
 * Preferimos degradar el dato antes que perder la vista completa.
 */
function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

@Component({
  selector: 'app-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiBadge, UiCard, UiIcon],
  templateUrl: './request-card.html',
  styleUrl: './request-card.scss',
})
export class RequestCard {
  readonly request = input.required<ParkingRequestInformation>();

  protected readonly dateRequest = computed(() => toDate(this.request().dateRequest));
  protected readonly dateResponse = computed(() => toDate(this.request().dateResponse));

  protected readonly statusTone = computed<BadgeTone>(() => {
    const status = normalize(this.request().status);

    if (status.includes('aprob')) {
      return 'success';
    }
    if (status.includes('rechaz')) {
      return 'danger';
    }
    if (status.includes('revis')) {
      return 'warning';
    }
    return 'brand';
  });
}
