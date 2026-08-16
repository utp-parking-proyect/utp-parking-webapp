import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { hasAnyRole } from '../auth/role-access';

export function roleGuard(allowed: readonly string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return hasAnyRole(authService.roles(), allowed) || router.createUrlTree(['/home']);
  };
}
