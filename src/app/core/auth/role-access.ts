import { computed, inject } from '@angular/core';
import { APPLICANT_ROLES, ROLE_SAE, ROLE_STUDENT } from './auth.constants';
import { AuthService } from './auth.service';

export function hasAnyRole(roles: readonly string[], allowed: readonly string[]): boolean {
  return roles.some((role) => allowed.includes(role));
}

export function injectRoleAccess() {
  const roles = inject(AuthService).roles;

  return {
    isApplicant: computed(() => hasAnyRole(roles(), APPLICANT_ROLES)),
    isStudent: computed(() => roles().includes(ROLE_STUDENT)),
    isSae: computed(() => roles().includes(ROLE_SAE)),
  };
}
