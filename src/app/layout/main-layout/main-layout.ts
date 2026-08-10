import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROLE_SAE } from '../../core/auth/auth.constants';
import { AuthService } from '../../core/auth/auth.service';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { IconName, UiIcon } from '../../shared/components/ui-icon/ui-icon';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
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
  private readonly router = inject(Router);

  protected readonly username = this.authService.username;
  protected readonly roles = this.authService.roles;
  protected readonly isSae = computed(() => this.authService.hasRole(ROLE_SAE));
  protected readonly roleLabel = computed(() => (this.isSae() ? 'Personal SAE' : 'Usuario'));

  protected readonly sidebarExpanded = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected readonly navItems: NavItem[] = [{ label: 'Inicio', icon: 'home', route: '/home' }];

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
