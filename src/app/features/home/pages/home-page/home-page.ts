import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiCard, UiIcon],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly actions: HomeAction[] = [
    {
      title: 'Nueva solicitud',
      description:
        'Solicita la autorización de ingreso al estacionamiento con uno de tus vehículos.',
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
}
