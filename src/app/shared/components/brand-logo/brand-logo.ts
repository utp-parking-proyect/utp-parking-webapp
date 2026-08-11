import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type LogoVariant = 'full' | 'mark';

const SOURCES: Record<LogoVariant, { src: string; ratio: number }> = {
  full: { src: 'brand/utp-parking-logo.png', ratio: 569 / 99 },
  mark: { src: 'brand/utp-mark.png', ratio: 291 / 100 },
};

@Component({
  selector: 'app-brand-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-logo.html',
  styleUrl: './brand-logo.scss',
})
export class BrandLogo {
  readonly variant = input<LogoVariant>('full');
  readonly height = input(28);

  protected readonly src = computed(() => SOURCES[this.variant()].src);
  protected readonly width = computed(() =>
    Math.round(this.height() * SOURCES[this.variant()].ratio),
  );
}
