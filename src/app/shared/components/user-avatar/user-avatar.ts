import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span>{{ initials() }}</span>',
  styleUrl: './user-avatar.scss',
  host: {
    '[style.--avatar-size]': 'size()',
    '[attr.aria-hidden]': 'true',
  },
})
export class UserAvatar {
  readonly name = input.required<string>();
  readonly size = input(40);

  protected readonly initials = computed(() => {
    const source = this.name().trim();
    if (!source) {
      return '';
    }

    const words = source.split(/\s+/);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  });
}
