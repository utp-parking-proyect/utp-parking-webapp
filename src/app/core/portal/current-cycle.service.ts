import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Cycle } from './models/cycle.model';
import { CURRENT_CYCLE_PATH } from './portal.constants';

const CURRENT_CYCLE_URL = `${environment.gatewayUrl}${CURRENT_CYCLE_PATH}`;

@Injectable({ providedIn: 'root' })
export class CurrentCycleService {
  private readonly authService = inject(AuthService);

  private readonly resource = httpResource<Cycle>(() =>
    this.authService.isAuthenticated() ? CURRENT_CYCLE_URL : undefined,
  );

  readonly isLoading = this.resource.isLoading;
  readonly hasFailed = computed(() => this.resource.error() !== undefined);

  /**
   * El portal es la única fuente de verdad del ciclo vigente: no lo calculamos ni lo cacheamos.
   * Es `null` mientras carga y también si el endpoint falla, para que quien filtre pueda decidir
   * mostrar todo en lugar de una lista vacía.
   */
  readonly name = computed(() => this.resource.value()?.nameCycle?.trim() || null);

  reload(): void {
    this.resource.reload();
  }
}
