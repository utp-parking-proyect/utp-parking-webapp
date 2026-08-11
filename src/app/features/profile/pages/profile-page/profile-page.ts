import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ROLE_SAE } from '../../../../core/auth/auth.constants';
import { AuthService } from '../../../../core/auth/auth.service';
import { roleLabel } from '../../../../core/auth/role-labels';
import { CurrentUserService } from '../../../../core/portal/current-user.service';
import { UiAlert } from '../../../../shared/components/ui-alert/ui-alert';
import { UiBadge } from '../../../../shared/components/ui-badge/ui-badge';
import { UiCard } from '../../../../shared/components/ui-card/ui-card';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiAlert, UiBadge, UiCard, UserAvatar],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  private readonly currentUserService = inject(CurrentUserService);

  protected readonly username = this.authService.username;
  protected readonly roles = this.authService.roles;
  protected readonly roleLabels = computed(() => this.roles().map(roleLabel));
  protected readonly session = this.authService.session;
  protected readonly isSae = computed(() => this.authService.hasRole(ROLE_SAE));

  protected readonly profile = this.currentUserService.profile;
  protected readonly displayName = this.currentUserService.displayName;
  protected readonly campusName = this.currentUserService.campusName;
  protected readonly profileLoading = this.currentUserService.isLoading;
  protected readonly profileFailed = this.currentUserService.hasFailed;
}
