import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UiButton } from '../ui-button/ui-button';
import { IconName, UiIcon } from '../ui-icon/ui-icon';

export interface NavGuideAnchor {
  top: number;
  left: number;
  width: number;
  height: number;
}

const POPOVER_GAP = 8;
const POPOVER_MARGIN = 16;
const POPOVER_RESERVED_HEIGHT = 232;

@Component({
  selector: 'app-nav-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiIcon],
  templateUrl: './nav-guide.html',
  styleUrl: './nav-guide.scss',
  host: {
    '[class.nav-guide--expanded]': 'expanded()',
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class NavGuide {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly description = input.required<string>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly anchor = input<NavGuideAnchor | null>(null);
  readonly expanded = input(false);

  readonly next = output<void>();
  readonly closed = output<void>();

  protected readonly isLast = computed(() => this.index() >= this.total() - 1);

  protected readonly popoverTop = computed(() => {
    const anchor = this.anchor();
    if (!anchor) {
      return null;
    }

    const preferredTop = anchor.top + anchor.height + POPOVER_GAP;
    const maxTop = window.innerHeight - POPOVER_RESERVED_HEIGHT;
    return Math.max(POPOVER_MARGIN, Math.min(preferredTop, maxTop));
  });
}
