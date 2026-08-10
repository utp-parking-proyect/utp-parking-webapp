import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.scss',
  host: {
    '[class.ui-button-host--block]': 'block()',
  },
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly block = input(false);
}
