import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Params, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { injectRoleAccess } from '../../core/auth/role-access';
import { roleLabel } from '../../core/auth/role-labels';
import { CurrentUserService } from '../../core/portal/current-user.service';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { NavGuide, NavGuideAnchor } from '../../shared/components/nav-guide/nav-guide';
import { IconName, UiIcon } from '../../shared/components/ui-icon/ui-icon';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';
import { NAV_GUIDE_DESCRIPTIONS } from './nav-guide-content';

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
  exact?: boolean;
  queryParams?: Params;
  shortLabel?: string;
}

interface GuideStep {
  item: NavItem;
  description: string;
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

const SECURITY_ITEMS: NavItem[] = [
  {
    label: 'Control de acceso',
    shortLabel: 'Control',
    icon: 'shield-check',
    route: '/control-acceso',
    exact: true,
  },
];

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, NavGuide, UiIcon, UserAvatar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  host: {
    '(window:resize)': 'measureGuide()',
  },
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
    ...(this.access.isSecurity() ? SECURITY_ITEMS : []),
  ]);

  private readonly navItemRefs = viewChildren<ElementRef<HTMLElement>>('navItemRef');

  protected readonly guideOpen = signal(false);
  protected readonly guideIndex = signal(0);
  protected readonly guideAnchor = signal<NavGuideAnchor | null>(null);

  protected readonly guideSteps = computed<GuideStep[]>(() => {
    if (!this.access.isStudent()) {
      return [];
    }

    return this.navItems()
      .map((item) => ({ item, description: NAV_GUIDE_DESCRIPTIONS[item.label] }))
      .filter((step): step is GuideStep => step.description !== undefined);
  });

  protected readonly guideAvailable = computed(() => this.guideSteps().length > 0);
  protected readonly guideStep = computed<GuideStep | null>(
    () => this.guideSteps()[this.guideIndex()] ?? null,
  );
  protected readonly isLastGuideStep = computed(
    () => this.guideIndex() >= this.guideSteps().length - 1,
  );

  constructor() {
    effect(() => {
      this.guideIndex();
      this.guideOpen();
      this.measureGuide();
    });
  }

  navLabel(item: NavItem): string {
    return this.sidebarExpanded() ? item.label : (item.shortLabel ?? item.label);
  }

  isGuided(item: NavItem): boolean {
    return this.guideStep()?.item === item;
  }

  openGuide(): void {
    if (!this.guideAvailable()) {
      return;
    }

    this.closeUserMenu();
    this.closeSidebar();
    this.guideIndex.set(0);
    this.guideOpen.set(true);
  }

  nextGuideStep(): void {
    if (this.isLastGuideStep()) {
      this.closeGuide();
      return;
    }

    this.guideIndex.update((index) => index + 1);
  }

  closeGuide(): void {
    if (!this.guideOpen()) {
      return;
    }

    this.guideOpen.set(false);
    this.guideIndex.set(0);
    this.guideAnchor.set(null);
  }

  measureGuide(): void {
    if (!this.guideOpen()) {
      this.guideAnchor.set(null);
      return;
    }

    const step = this.guideStep();
    const index = step === null ? -1 : this.navItems().indexOf(step.item);
    const element = index < 0 ? undefined : this.navItemRefs()[index]?.nativeElement;

    if (!element) {
      this.guideAnchor.set(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && rect.right > 0;

    this.guideAnchor.set(
      isVisible
        ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        : null,
    );
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
