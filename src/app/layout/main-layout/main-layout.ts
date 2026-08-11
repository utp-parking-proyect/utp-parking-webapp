import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
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
}

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

  protected readonly username = this.authService.username;
  protected readonly roles = this.authService.roles;
  protected readonly displayName = this.currentUserService.displayName;
  protected readonly firstName = this.currentUserService.firstName;
  protected readonly roleLabels = computed(() => this.roles().map(roleLabel));
  /** El topbar muestra un solo rol, como el portal UTP; el desplegable los lista todos. */
  protected readonly primaryRoleLabel = computed(() => this.roleLabels()[0] ?? null);

  protected readonly sidebarExpanded = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'home', route: '/home' },
    { label: 'Nueva solicitud', icon: 'car', route: '/solicitudes/nueva' },
    { label: 'Mis solicitudes', icon: 'clipboard', route: '/solicitudes', exact: true },
  ];

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
