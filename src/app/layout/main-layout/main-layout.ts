import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Params, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { injectRoleAccess } from '../../core/auth/role-access';
import { roleLabel } from '../../core/auth/role-labels';
import { CurrentUserService } from '../../core/portal/current-user.service';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { IconName, UiIcon } from '../../shared/components/ui-icon/ui-icon';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
  exact?: boolean;
  queryParams?: Params;
  /** Etiqueta corta para el riel contraído, donde no cabe la etiqueta completa. */
  shortLabel?: string;
}

const HOME_ITEM: NavItem = { label: 'Inicio', icon: 'home', route: '/home' };

const APPLICANT_ITEMS: NavItem[] = [
  { label: 'Nueva solicitud', icon: 'car', route: '/solicitudes/nueva' },
  { label: 'Mis solicitudes', icon: 'clipboard', route: '/solicitudes', exact: true },
  { label: 'Mis vehículos', icon: 'car', route: '/vehiculos', exact: true },
  {
    label: 'Historial',
    icon: 'history',
    route: '/solicitudes',
    exact: true,
    queryParams: { vista: 'historial' },
  },
];

const SAE_ITEMS: NavItem[] = [
  {
    label: 'Ingreso al estacionamiento',
    shortLabel: 'Ingreso',
    icon: 'inbox',
    route: '/revisiones',
    exact: true,
  },
  {
    label: 'Desasignación de vehículos',
    shortLabel: 'Vehículos',
    icon: 'car',
    route: '/revisiones-vehiculos',
    exact: true,
  },
  {
    label: 'Historial de revisiones',
    shortLabel: 'Historial',
    icon: 'history',
    route: '/revisiones',
    exact: true,
    queryParams: { vista: 'revisadas' },
  },
];

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, UiIcon, UserAvatar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly authService = inject(AuthService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly access = injectRoleAccess();

  protected readonly username = this.authService.username;
  protected readonly roles = this.authService.roles;
  protected readonly displayName = this.currentUserService.displayName;
  protected readonly firstName = this.currentUserService.firstName;
  protected readonly roleLabels = computed(() => this.roles().map(roleLabel));
  protected readonly primaryRoleLabel = computed(() => this.roleLabels()[0] ?? null);

  protected readonly sidebarExpanded = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected readonly navItems = computed<NavItem[]>(() => [
    HOME_ITEM,
    ...(this.access.isApplicant() ? APPLICANT_ITEMS : []),
    ...(this.access.isSae() ? SAE_ITEMS : []),
  ]);

  navLabel(item: NavItem): string {
    return this.sidebarExpanded() ? item.label : (item.shortLabel ?? item.label);
  }

  toggleSidebar(): void {
    this.sidebarExpanded.update((expanded) => !expanded);
  }

  closeSidebar(): void {
    this.sidebarExpanded.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
