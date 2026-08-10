import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './ui-badge.scss',
  host: {
    '[class]': '"ui-badge--" + tone()',
  },
})
export class UiBadge {
  readonly tone = input<BadgeTone>('neutral');
}
