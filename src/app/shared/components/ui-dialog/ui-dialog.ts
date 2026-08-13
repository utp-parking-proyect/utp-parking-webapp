import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

export type DialogTone = 'brand' | 'danger';

@Component({
  selector: 'app-ui-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon],
  templateUrl: './ui-dialog.html',
  styleUrl: './ui-dialog.scss',
  host: {
    '(document:keydown.escape)': 'dismiss()',
  },
})
export class UiDialog {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly tone = input<DialogTone>('brand');
  readonly busy = input(false);

  readonly closed = output<void>();

  dismiss(): void {
    if (!this.busy()) {
      this.closed.emit();
    }
  }
}
