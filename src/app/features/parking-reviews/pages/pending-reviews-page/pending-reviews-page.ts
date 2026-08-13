import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { ReviewRequestList } from '../../components/review-request-list/review-request-list';

type ReviewsView = 'pendientes' | 'revisadas';

interface ViewOption {
  value: ReviewsView;
  label: string;
}

const VIEWS: ViewOption[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'revisadas', label: 'Revisadas' },
];

@Component({
  selector: 'app-pending-reviews-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReviewRequestList, UiAlert, UiButton, UiCard, UiIcon],
  templateUrl: './pending-reviews-page.html',
  styleUrl: './pending-reviews-page.scss',
})
export class PendingReviewsPage {
  private readonly parkingReviewService = inject(ParkingReviewService);
  private readonly currentCycleService = inject(CurrentCycleService);

  readonly vista = input<string>();
  readonly respondida = input<string>();
  readonly resultado = input<string>();

  protected readonly views = VIEWS;
  protected readonly currentCycleName = this.currentCycleService.name;
  protected readonly isLoading = this.parkingReviewService.isLoading;
  protected readonly hasFailed = this.parkingReviewService.hasFailed;
  protected readonly pendingCount = computed(
    () => this.parkingReviewService.pendingRequests().length,
  );

  protected readonly view = computed<ReviewsView>(() =>
    this.vista() === 'revisadas' ? 'revisadas' : 'pendientes',
  );

  protected readonly visibleRequests = computed(() =>
    this.view() === 'revisadas'
      ? this.parkingReviewService.reviewedRequests()
      : this.parkingReviewService.pendingRequests(),
  );

  protected readonly feedback = computed(() => {
    const requestId = this.respondida();
    if (!requestId) {
      return null;
    }
    return this.resultado() === 'rechazada'
      ? `La solicitud #${requestId} fue rechazada correctamente.`
      : `La solicitud #${requestId} fue aceptada correctamente.`;
  });

  countFor(view: ReviewsView): number {
    return view === 'revisadas'
      ? this.parkingReviewService.reviewedRequests().length
      : this.pendingCount();
  }

  reload(): void {
    this.parkingReviewService.reload();
    this.currentCycleService.reload();
  }
}
