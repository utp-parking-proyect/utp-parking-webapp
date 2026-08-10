import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AUTHENTICATE_PATH } from './auth.constants';
import { AuthResponse } from './models/auth-response.model';
import { JwtClaims } from './models/jwt-claims.model';
import { LoginRequest } from './models/login-request.model';
import { Session } from './models/session.model';
import { decodeJwt, isJwtExpired } from './jwt.util';
import { TokenStorageService } from './token-storage.service';

const AUTHENTICATE_URL = `${environment.gatewayUrl}${AUTHENTICATE_PATH}`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly _session = signal<Session | null>(this.restoreSession());

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly username = computed(() => this._session()?.username ?? null);
  readonly roles = computed(() => this._session()?.roles ?? []);

  login(credentials: LoginRequest): Observable<Session> {
    return this.http.post<AuthResponse>(AUTHENTICATE_URL, credentials).pipe(
      map((response) => this.buildSession(response.token)),
      tap((session) => {
        this.tokenStorage.setToken(session.token);
        this._session.set(session);
      }),
    );
  }

  logout(): void {
    this.tokenStorage.clearToken();
    this._session.set(null);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  private restoreSession(): Session | null {
    const token = this.tokenStorage.getToken();
    if (!token) {
      return null;
    }

    const claims = decodeJwt<JwtClaims>(token);
    if (!claims || isJwtExpired(claims)) {
      this.tokenStorage.clearToken();
      return null;
    }

    return this.sessionFromClaims(token, claims);
  }

  private buildSession(token: string): Session {
    const claims = decodeJwt<JwtClaims>(token);
    if (!claims) {
      throw new Error('El token recibido no es un JWT válido.');
    }
    return this.sessionFromClaims(token, claims);
  }

  private sessionFromClaims(token: string, claims: JwtClaims): Session {
    return {
      token,
      username: claims.sub,
      userId: claims.userId,
      roles: claims.roles ?? [],
    };
  }
}
