import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { injectRoleAccess } from '../../../../core/auth/role-access';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { isToday } from '../../../../core/parking/request-status.util';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
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

interface WorkloadStat {
  label: string;
  value: number;
  hint: string;
  icon: IconName;
  variant: 'parking' | 'unassignment' | 'done';
  route: string;
  queryParams?: Params;
}

interface ParkingAvailability {
  idLocation: number;
  nameLocation: string;
  availableSpaces: number;
  totalSpaces: number;
}

interface DigitalPlatform {
  name: string;
  logo: string;
  preview: string;
  description: string;
  url: string;
}

const PLACEHOLDER_PARKING_AVAILABILITY: ParkingAvailability[] = [
  { idLocation: 1, nameLocation: 'Lima Centro', availableSpaces: 42, totalSpaces: 120 },
  { idLocation: 2, nameLocation: 'Lima Norte', availableSpaces: 18, totalSpaces: 80 },
  { idLocation: 3, nameLocation: 'Lima Sur', availableSpaces: 0, totalSpaces: 60 },
];

const DIGITAL_PLATFORMS: DigitalPlatform[] = [
  {
    name: 'UTP+info',
    logo: 'platforms/utp-info-logo.svg',
    preview: 'platforms/utp-info-preview.svg',
    description: 'Encuentra toda la información de la universidad.',
    url: 'https://info.utp.edu.pe',
  },
  {
    name: 'UTP+class',
    logo: 'platforms/utp-class-logo.svg',
    preview: 'platforms/utp-class-preview.svg',
    description: 'Revisa el contenido de tus clases desde tu computadora o celular.',
    url: 'https://class.utp.edu.pe',
  },
];

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
    title: 'Mis vehículos',
    description: 'Registra tus vehículos y solicita la desasignación de los que ya no uses.',
    cta: 'Administrar vehículos',
    icon: 'car',
    route: '/vehiculos',
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
    title: 'Ingreso al estacionamiento',
    description: 'Revisa las solicitudes de autorización de ingreso que tienes asignadas.',
    cta: 'Revisar solicitudes',
    icon: 'inbox',
    route: '/revisiones',
  },
  {
    title: 'Desasignación de vehículos',
    description: 'Responde las solicitudes de usuarios que quieren dejar de usar un vehículo.',
    cta: 'Revisar desasignaciones',
    icon: 'car',
    route: '/revisiones-vehiculos',
  },
  {
    title: 'Historial de revisiones',
    description: 'Consulta y filtra todas las solicitudes que ya aprobaste o rechazaste.',
    cta: 'Ver historial',
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
  private readonly parkingReviewService = inject(ParkingReviewService);
  private readonly unassignmentService = inject(VehicleUnassignmentService);

  protected readonly isSae = this.access.isSae;
  protected readonly isApplicant = this.access.isApplicant;
  protected readonly isStudent = this.access.isStudent;
  protected readonly availability = PLACEHOLDER_PARKING_AVAILABILITY;
  protected readonly platforms = DIGITAL_PLATFORMS;

  protected readonly totalAvailableSpaces = this.availability.reduce(
    (total, location) => total + location.availableSpaces,
    0,
  );

  occupancyFor(location: ParkingAvailability): number {
    if (location.totalSpaces <= 0) {
      return 0;
    }
    return Math.round((location.availableSpaces / location.totalSpaces) * 100);
  }

  availabilityTone(location: ParkingAvailability): 'full' | 'low' | 'free' {
    if (location.availableSpaces === 0) {
      return 'full';
    }
    return this.occupancyFor(location) <= 25 ? 'low' : 'free';
  }

  protected readonly actions = computed<HomeAction[]>(() => [
    ...(this.access.isApplicant() ? APPLICANT_ACTIONS : []),
    ...(this.access.isSae() ? SAE_ACTIONS : []),
  ]);

  protected readonly workloadLoading = computed(
    () => this.parkingReviewService.isLoading() || this.unassignmentService.acceptorIsLoading(),
  );

  private readonly pendingParking = computed(
    () => this.parkingReviewService.pendingRequests().length,
  );

  private readonly pendingUnassignment = computed(
    () => this.unassignmentService.pendingAcceptorRequests().length,
  );

  protected readonly pendingTotal = computed(
    () => this.pendingParking() + this.pendingUnassignment(),
  );

  private readonly reviewedToday = computed(
    () =>
      this.parkingReviewService
        .reviewedRequests()
        .filter((request) => isToday(request.dateResponse)).length +
      this.unassignmentService
        .reviewedAcceptorRequests()
        .filter((request) => isToday(request.dateResponse)).length,
  );

  protected readonly workload = computed<WorkloadStat[]>(() => [
    {
      label: 'Ingreso al estacionamiento',
      value: this.pendingParking(),
      hint: 'Pendientes de tu revisión',
      icon: 'inbox',
      variant: 'parking',
      route: '/revisiones',
    },
    {
      label: 'Desasignación de vehículos',
      value: this.pendingUnassignment(),
      hint: 'Pendientes de tu revisión',
      icon: 'car',
      variant: 'unassignment',
      route: '/revisiones-vehiculos',
    },
    {
      label: 'Revisadas hoy',
      value: this.reviewedToday(),
      hint: 'Solicitudes que respondiste hoy',
      icon: 'shield-check',
      variant: 'done',
      route: '/revisiones',
      queryParams: { vista: 'revisadas' },
    },
  ]);
}
