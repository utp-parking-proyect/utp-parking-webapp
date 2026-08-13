import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { APPLICANT_ROLES, ROLE_SAE, ROLE_STUDENT } from '../auth/auth.constants';
import { AuthService } from '../auth/auth.service';
import { roleGuard } from './role.guard';

function runGuard(allowed: readonly string[], roles: string[]): boolean | UrlTree {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { roles: signal(roles) } }],
  });

  return TestBed.runInInjectionContext(() =>
    roleGuard(allowed)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

function isRedirectToHome(result: boolean | UrlTree): boolean {
  return result instanceof UrlTree && TestBed.inject(Router).serializeUrl(result) === '/home';
}

describe('roleGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('deja pasar a los roles solicitantes a las rutas de solicitudes', () => {
    expect(runGuard(APPLICANT_ROLES, [ROLE_STUDENT])).toBe(true);
  });

  it('bloquea a ROLE_SAE en las rutas de solicitudes', () => {
    expect(isRedirectToHome(runGuard(APPLICANT_ROLES, [ROLE_SAE]))).toBe(true);
  });

  it('bloquea a los roles solicitantes en las rutas de revisión', () => {
    expect(isRedirectToHome(runGuard([ROLE_SAE], [ROLE_STUDENT]))).toBe(true);
  });

  it('deja pasar a ROLE_SAE a las rutas de revisión', () => {
    expect(runGuard([ROLE_SAE], [ROLE_SAE])).toBe(true);
  });

  it('permite ambos flujos cuando el usuario acumula roles', () => {
    const roles = [ROLE_SAE, ROLE_STUDENT];
    expect(runGuard([ROLE_SAE], roles)).toBe(true);
    TestBed.resetTestingModule();
    expect(runGuard(APPLICANT_ROLES, roles)).toBe(true);
  });

  it('bloquea a un usuario sin roles', () => {
    expect(isRedirectToHome(runGuard(APPLICANT_ROLES, []))).toBe(true);
  });
});
