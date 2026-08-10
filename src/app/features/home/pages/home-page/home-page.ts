import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ROLE_SAE } from '../../../../core/auth/auth.constants';
import { AuthService } from '../../../../core/auth/auth.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { IconName, UiIcon } from '../../../../shared/components/ui-icon/ui-icon';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';

interface UpcomingModule {
  title: string;
  description: string;
  icon: IconName;
}

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiAlert, UiBadge, UiCard, UiIcon, UserAvatar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly authService = inject(AuthService);

  protected readonly username = this.authService.username;
  protected readonly roles = this.authService.roles;
  protected readonly session = this.authService.session;
  protected readonly isSae = computed(() => this.authService.hasRole(ROLE_SAE));

  protected readonly upcomingModules = computed<UpcomingModule[]>(() =>
    this.isSae()
      ? [
          {
            title: 'Revisión de solicitudes',
            description: 'Aprueba o rechaza las solicitudes asignadas a tu campus.',
            icon: 'shield-check',
          },
          {
            title: 'Historial de respuestas',
            description: 'Consulta las solicitudes que ya has atendido.',
            icon: 'history',
          },
        ]
      : [
          {
            title: 'Mis vehículos',
            description: 'Registra los vehículos con los que ingresas al campus.',
            icon: 'car',
          },
          {
            title: 'Solicitudes',
            description: 'Pide autorización para usar el estacionamiento.',
            icon: 'clipboard',
          },
          {
            title: 'Historial',
            description: 'Revisa el estado y la respuesta de tus solicitudes.',
            icon: 'history',
          },
        ],
  );
}
