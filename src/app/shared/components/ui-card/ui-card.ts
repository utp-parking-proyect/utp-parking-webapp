import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './ui-card.scss',
  host: {
    '[class.ui-card--padded]': 'padded()',
  },
})
export class UiCard {
  readonly padded = input(true);
}
