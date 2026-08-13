import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink],
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
  readonly routerLink = input<string | unknown[]>();
  readonly queryParams = input<Params>();

  protected readonly classes = computed(
    () => `ui-button--${this.variant()} ui-button--${this.size()}`,
  );
}
