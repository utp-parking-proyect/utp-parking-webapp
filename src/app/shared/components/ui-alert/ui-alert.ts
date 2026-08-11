import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconName, UiIcon } from '../ui-icon/ui-icon';

export type AlertTone = 'info' | 'success' | 'danger';

const TONE_ICONS: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  danger: 'alert-circle',
};

@Component({
  selector: 'app-ui-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon],
  templateUrl: './ui-alert.html',
  styleUrl: './ui-alert.scss',
  host: {
    '[class]': '"ui-alert--" + tone()',
    role: 'alert',
  },
})
export class UiAlert {
  readonly tone = input<AlertTone>('info');
  protected readonly icon = computed(() => TONE_ICONS[this.tone()]);
}
