import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'user'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'info'
  | 'alert-circle'
  | 'alert-triangle'
  | 'user-slash'
  | 'x'
  | 'check-circle'
  | 'home'
  | 'car'
  | 'clipboard'
  | 'history'
  | 'menu'
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-left'
  | 'arrow-right'
  | 'plus-circle'
  | 'calendar'
  | 'clock'
  | 'log-out'
  | 'shield-check'
  | 'help-circle'
  | 'lock-closed'
  | 'sparkles';

@Component({
  selector: 'app-ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-icon.html',
  styleUrl: './ui-icon.scss',
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
