import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { injectRoleAccess } from '../../../../core/auth/role-access';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { IconName, UiIcon } from '../../../../shared/components/ui-icon/ui-icon';

interface HomeAction {
  title: string;
  description: string;
  cta: string;
  icon: IconName;
  route: string;
  queryParams?: Params;
}

const APPLICANT_ACTIONS: HomeAction[] = [
  {
    title: 'Nueva solicitud',
    description: 'Solicita la autorización de ingreso al estacionamiento con uno de tus vehículos.',
    cta: 'Solicitar autorización',
    icon: 'car',
    route: '/solicitudes/nueva',
  },
  {
    title: 'Mis solicitudes',
    description: 'Revisa el estado de las solicitudes que enviaste durante el ciclo.',
    cta: 'Ver solicitudes',
    icon: 'clipboard',
    route: '/solicitudes',
  },
  {
    title: 'Historial',
    description: 'Consulta las solicitudes que ya fueron atendidas por el personal SAE.',
    cta: 'Ver historial',
    icon: 'history',
    route: '/solicitudes',
    queryParams: { vista: 'historial' },
  },
];

const SAE_ACTIONS: HomeAction[] = [
  {
    title: 'Solicitudes pendientes',
    description: 'Revisa las solicitudes de estacionamiento que tienes asignadas y respóndelas.',
    cta: 'Revisar solicitudes',
    icon: 'inbox',
    route: '/revisiones',
  },
  {
    title: 'Solicitudes revisadas',
    description: 'Consulta las solicitudes que ya aprobaste o rechazaste.',
    cta: 'Ver revisadas',
    icon: 'history',
    route: '/revisiones',
    queryParams: { vista: 'revisadas' },
  },
];

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiCard, UiIcon],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly access = injectRoleAccess();

  protected readonly actions = computed<HomeAction[]>(() => [
    ...(this.access.isApplicant() ? APPLICANT_ACTIONS : []),
    ...(this.access.isSae() ? SAE_ACTIONS : []),
  ]);
}
