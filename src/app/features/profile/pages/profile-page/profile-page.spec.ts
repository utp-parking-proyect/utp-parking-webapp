import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserProfile } from '../../../../core/portal/models/user-profile.model';
import { CurrentUserService } from '../../../../core/portal/current-user.service';
import { ProfilePage } from './profile-page';

function profileWith(career: string): UserProfile {
  return {
    idUser: 1,
    username: 'U23201703',
    name: 'Juan',
    lastname: 'Pérez',
    dni: '70000000',
    institutionalEmail: 'U23201703@utp.edu.pe',
    career,
    actualRegistered: true,
    roles: [],
    campus: { idCampus: 1, nameCampus: 'Lima Centro' },
  };
}

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  const profile = signal<UserProfile | undefined>(undefined);

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rowLabels(): string[] {
    return [...host().querySelectorAll('.session__row dt')].map(
      (element) => element.textContent?.trim() ?? '',
    );
  }

  function build(): void {
    fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    profile.set(undefined);

    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        {
          provide: AuthService,
          useValue: {
            username: signal('U23201703'),
            roles: signal(['ROLE_STUDENT']),
            session: signal(null),
            hasRole: () => false,
          },
        },
        {
          provide: CurrentUserService,
          useValue: {
            profile,
            displayName: signal('Juan Pérez'),
            campusName: computed(() => profile()?.campus?.nameCampus ?? null),
            isLoading: signal(false),
            hasFailed: signal(false),
          },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra la carrera cuando el usuario tiene una asignada', () => {
    profile.set(profileWith('Ingeniería de Sistemas'));
    build();

    expect(rowLabels()).toContain('Carrera');
    expect(host().textContent).toContain('Ingeniería de Sistemas');
  });

  it('oculta la fila de carrera cuando viene vacía', () => {
    profile.set(profileWith(''));
    build();

    expect(rowLabels()).not.toContain('Carrera');
  });

  it('oculta la fila de carrera cuando solo trae espacios', () => {
    profile.set(profileWith('   '));
    build();

    expect(rowLabels()).not.toContain('Carrera');
  });

  it('mantiene el resto de los datos del perfil', () => {
    profile.set(profileWith(''));
    build();

    expect(rowLabels()).toEqual([
      'Usuario',
      'Nombres',
      'Apellidos',
      'Correo institucional',
      'Campus',
      'Perfil',
    ]);
  });
});
