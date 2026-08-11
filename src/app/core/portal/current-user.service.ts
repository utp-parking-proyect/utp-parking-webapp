import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { UserProfile } from './models/user-profile.model';
import { CURRENT_USER_PATH } from './portal.constants';

const CURRENT_USER_URL = `${environment.gatewayUrl}${CURRENT_USER_PATH}`;

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly authService = inject(AuthService);

  private readonly resource = httpResource<UserProfile>(() =>
    this.authService.isAuthenticated() ? CURRENT_USER_URL : undefined,
  );

  readonly profile = this.resource.value;
  readonly isLoading = this.resource.isLoading;
  readonly hasFailed = computed(() => this.resource.error() !== undefined);

  /** Nombre completo, con el username del token como respaldo si el perfil aún no llegó. */
  readonly displayName = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return this.authService.username() ?? '';
    }
    return `${profile.name} ${profile.lastname}`.trim();
  });

  /** Solo el primer nombre, para saludos: «Jose Carlos Pérez» → «Jose». */
  readonly firstName = computed(() => this.displayName().trim().split(/\s+/)[0] ?? '');

  readonly campusName = computed(() => this.profile()?.campus?.nameCampus ?? null);

  reload(): void {
    this.resource.reload();
  }
}
