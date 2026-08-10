import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { BrandLogo } from '../../../../shared/components/brand-logo/brand-logo';
import { UiButton } from '../../../../shared/components/ui-button/ui-button';
import { UiFormField } from '../../../../shared/components/ui-form-field/ui-form-field';
import { UiIcon } from '../../../../shared/components/ui-icon/ui-icon';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BrandLogo, UiButton, UiFormField, UiIcon],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly credentialsRejected = signal(false);
  protected readonly showPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  errorFor(control: FormControl<string>, message: string): string | null {
    return control.invalid && control.touched ? message : null;
  }

  dismissError(): void {
    if (this.errorMessage()) {
      this.errorMessage.set(null);
      this.credentialsRejected.set(false);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dismissError();
    this.submitting.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);

        if (error.status === 401) {
          this.credentialsRejected.set(true);
          this.errorMessage.set('Usuario y/o contraseña incorrectos');
          this.form.reset();
          this.showPassword.set(false);
          return;
        }

        this.errorMessage.set('No se pudo iniciar sesión. Intenta nuevamente.');
      },
    });
  }
}
