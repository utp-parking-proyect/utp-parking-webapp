import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { IconName, UiIcon } from '../ui-icon/ui-icon';

export type AlertTone = 'info' | 'success' | 'danger';

const TONE_ICONS: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  danger: 'alert-circle',
};

const LEAVE_DURATION_MS = 260;

@Component({
  selector: 'app-ui-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon],
  templateUrl: './ui-alert.html',
  styleUrl: './ui-alert.scss',
  host: {
    '[class]': '"ui-alert--" + tone()',
    '[class.ui-alert--leaving]': 'leaving()',
    '[class.ui-alert--dismissed]': 'dismissed()',
    role: 'alert',
  },
})
export class UiAlert {
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly tone = input<AlertTone>('info');
  readonly dismissible = input(true);

  readonly closed = output<void>();

  protected readonly leaving = signal(false);
  protected readonly dismissed = signal(false);
  protected readonly icon = computed(() => TONE_ICONS[this.tone()]);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  dismiss(): void {
    if (this.leaving() || this.dismissed()) {
      return;
    }

    this.leaving.set(true);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.leaving.set(false);
      this.dismissed.set(true);
      this.closed.emit();
    }, LEAVE_DURATION_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
