import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

@Component({
  selector: 'app-ui-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon],
  templateUrl: './ui-form-field.html',
  styleUrl: './ui-form-field.scss',
})
export class UiFormField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly invalid = input(false);

  protected readonly showInvalid = computed(() => this.invalid() || !!this.error());
}
