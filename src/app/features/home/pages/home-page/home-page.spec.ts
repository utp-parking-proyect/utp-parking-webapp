import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let roles: WritableSignal<string[]>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function build(): void {
    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
  }

  function spots(): HTMLElement[] {
    return [...host().querySelectorAll<HTMLElement>('.spot')];
  }

  function platforms(): HTMLAnchorElement[] {
    return [...host().querySelectorAll<HTMLAnchorElement>('a.platform')];
  }

  beforeEach(() => {
    roles = signal(['ROLE_STUDENT']);

    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { roles } },
        {
          provide: ParkingReviewService,
          useValue: {
            pendingRequests: signal([]),
            reviewedRequests: signal([]),
            isLoading: signal(false),
          },
        },
        {
          provide: VehicleUnassignmentService,
          useValue: {
            pendingAcceptorRequests: signal([]),
            reviewedAcceptorRequests: signal([]),
            acceptorIsLoading: signal(false),
          },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('no muestra el banner de bienvenida', () => {
    build();

    expect(host().querySelector('.hero')).toBeNull();
    expect(text()).not.toContain('Bienvenido a UTP+ Parking');
  });

  it('muestra una card por sede con los espacios disponibles', () => {
    build();

    expect(spots().length).toBe(3);
    expect(spots()[0].textContent).toContain('Lima Centro');
    expect(spots()[0].textContent).toContain('42');
    expect(spots()[0].textContent).toContain('de 120');
  });

  it('resume el total de espacios libres', () => {
    build();

    expect(text()).toContain('60 espacios libres');
  });

  it('destaca la sede que se quedó sin espacios', () => {
    build();

    const full = spots()[2];
    expect(full.classList).toContain('spot--full');
    expect(full.textContent).toContain('Sin espacios disponibles');
  });

  it('muestra las plataformas digitales de la UTP', () => {
    build();

    expect(text()).toContain('Tus plataformas digitales');
    expect(platforms().length).toBe(2);
    expect(platforms()[0].getAttribute('href')).toBe('https://info.utp.edu.pe');
    expect(platforms()[1].getAttribute('href')).toBe('https://class.utp.edu.pe');
  });

  it('abre las plataformas en una pestaña nueva de forma segura', () => {
    build();

    for (const platform of platforms()) {
      expect(platform.getAttribute('target')).toBe('_blank');
      expect(platform.getAttribute('rel')).toContain('noopener');
    }
  });

  it('oculta el panel de carga del SAE a los solicitantes', () => {
    build();

    expect(host().querySelector('.workload')).toBeNull();
  });

  it('muestra el panel de carga al personal SAE', () => {
    roles.set(['ROLE_SAE']);
    build();

    expect(host().querySelector('.workload')).not.toBeNull();
    expect(text()).toContain('Tu carga de hoy');
  });

  it('oculta los estacionamientos disponibles al personal SAE', () => {
    roles.set(['ROLE_SAE']);
    build();

    expect(host().querySelector('.availability')).toBeNull();
    expect(spots().length).toBe(0);
    expect(text()).not.toContain('Estacionamientos disponibles');
  });

  it('encabeza la página del SAE con su carga del día', () => {
    roles.set(['ROLE_SAE']);
    build();

    const heading = host().querySelector('h1');
    expect(heading?.textContent).toContain('Tu carga de hoy');
  });

  it('encabeza la página del solicitante con los estacionamientos disponibles', () => {
    build();

    const heading = host().querySelector('h1');
    expect(heading?.textContent).toContain('Estacionamientos disponibles');
  });

  it('oculta las plataformas digitales al personal SAE', () => {
    roles.set(['ROLE_SAE']);
    build();

    expect(host().querySelector('.platforms')).toBeNull();
    expect(platforms().length).toBe(0);
    expect(text()).not.toContain('Tus plataformas digitales');
  });

  it('oculta las plataformas digitales a docentes y administrativos', () => {
    roles.set(['ROLE_TEACHER']);
    build();

    expect(platforms().length).toBe(0);

    roles.set(['ROLE_ADMINISTRATIVE']);
    fixture.detectChanges();

    expect(platforms().length).toBe(0);
  });

  it('mantiene los estacionamientos disponibles para docentes y administrativos', () => {
    roles.set(['ROLE_TEACHER']);
    build();

    expect(spots().length).toBe(3);
  });
});
