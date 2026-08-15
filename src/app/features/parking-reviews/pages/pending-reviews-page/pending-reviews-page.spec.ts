import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { VehicleUnassignmentRequestDetail } from '../../../../core/parking/models/vehicle.model';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
import { VehicleUnassignmentService } from '../../../../core/parking/vehicle-unassignment.service';
import { CurrentCycleService } from '../../../../core/portal/current-cycle.service';
import { PendingReviewsPage } from './pending-reviews-page';

interface RequestOptions {
  id: number;
  cycle?: string;
  plate?: string;
  name?: string;
  lastName?: string;
  username?: string;
  date?: string;
  status?: string;
}

function request(options: RequestOptions): ParkingRequestInformation {
  return {
    idRequest: options.id,
    applicant: {
      idApplicant: options.id,
      nameApplicant: options.name ?? 'Juan',
      lastNameApplicant: options.lastName ?? 'Pérez',
      usernameApplicant: options.username ?? `U000${options.id}`,
      numberCycle: options.cycle ?? '2026-1',
    },
    vehicle: {
      numberPlate: options.plate ?? `ABC-${String(options.id).padStart(3, '0')}`,
      vehicleType: 'Automóvil',
    },
    dateRequest: options.date ?? `2026-03-${String(options.id).padStart(2, '0')}T10:00:00Z`,
    dateResponse: null,
    status: options.status ?? 'En revisión',
  };
}

function unassignment(options: RequestOptions): VehicleUnassignmentRequestDetail {
  return {
    idUnassignmentRequest: options.id,
    idVehicle: options.id,
    applicant: {
      idApplicant: options.id,
      nameApplicant: options.name ?? 'Ana',
      lastNameApplicant: options.lastName ?? 'Gómez',
      usernameApplicant: options.username ?? `U900${options.id}`,
      numberCycle: options.cycle ?? '2026-1',
    },
    vehicle: {
      numberPlate: options.plate ?? `DES-${String(options.id).padStart(3, '0')}`,
      vehicleType: 'Automóvil',
    },
    reason: 'Vendí el vehículo.',
    status: options.status ?? 'APROBADO',
    dateRequest: options.date ?? `2026-03-${String(options.id).padStart(2, '0')}T10:00:00Z`,
    dateResponse: '2026-03-21T10:00:00Z',
    workflow: [
      {
        status: options.status ?? 'APROBADO',
        dateStatusChange: '2026-03-21T10:00:00Z',
        observation: 'Desasignación aprobada.',
      },
    ],
  };
}

function manyRequests(total: number): ParkingRequestInformation[] {
  return Array.from({ length: total }, (_, index) => request({ id: index + 1 }));
}

describe('PendingReviewsPage filtros y paginado', () => {
  let fixture: ComponentFixture<PendingReviewsPage>;
  const pendingRequests = signal<ParkingRequestInformation[]>([]);
  const reviewedRequests = signal<ParkingRequestInformation[]>([]);
  const pendingAcceptorRequests = signal<VehicleUnassignmentRequestDetail[]>([]);
  const reviewedAcceptorRequests = signal<VehicleUnassignmentRequestDetail[]>([]);

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function rows(): HTMLTableRowElement[] {
    return [...host().querySelectorAll<HTMLTableRowElement>('.reviews-table tbody tr')];
  }

  function plates(): string[] {
    return rows().map(
      (row) => row.querySelector('.reviews-table__plate strong')?.textContent ?? '',
    );
  }

  function build(vista?: string): void {
    fixture = TestBed.createComponent(PendingReviewsPage);
    fixture.componentRef.setInput('vista', vista);
    fixture.detectChanges();
  }

  function kinds(): string[] {
    return rows().map((row) => row.querySelector('.reviews-table__kind')?.textContent?.trim() ?? '');
  }

  function search(value: string): void {
    const input = host().querySelector<HTMLInputElement>('#reviews-search')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function selectOption(selector: string, value: string): void {
    const select = host().querySelector<HTMLSelectElement>(selector)!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function goToPage(page: number): void {
    const button = [...host().querySelectorAll<HTMLButtonElement>('.pagination__page')].find(
      (element) => element.textContent?.trim() === String(page),
    )!;
    button.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    pendingRequests.set([]);
    reviewedRequests.set([]);
    pendingAcceptorRequests.set([]);
    reviewedAcceptorRequests.set([]);

    TestBed.configureTestingModule({
      imports: [PendingReviewsPage],
      providers: [
        provideRouter([]),
        {
          provide: ParkingReviewService,
          useValue: {
            pendingRequests,
            reviewedRequests,
            isLoading: signal(false),
            hasFailed: signal(false),
            reload: () => undefined,
          },
        },
        {
          provide: VehicleUnassignmentService,
          useValue: {
            pendingAcceptorRequests,
            reviewedAcceptorRequests,
            acceptorIsLoading: signal(false),
            acceptorHasFailed: signal(false),
            reloadAcceptor: () => undefined,
          },
        },
        {
          provide: CurrentCycleService,
          useValue: {
            name: signal('2026-1'),
            isLoading: signal(false),
            reload: () => undefined,
          },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra solo la primera página de solicitudes', () => {
    pendingRequests.set(manyRequests(25));
    build();

    expect(rows().length).toBe(10);
    expect(host().querySelector('.pagination__summary')?.textContent).toContain('25');
  });

  it('navega a la última página y muestra el resto', () => {
    pendingRequests.set(manyRequests(25));
    build();

    goToPage(3);

    expect(rows().length).toBe(5);
  });

  it('no pagina cuando las solicitudes caben en una página', () => {
    pendingRequests.set(manyRequests(4));
    build();

    expect(rows().length).toBe(4);
    expect(host().querySelectorAll('.pagination__page').length).toBe(1);
  });

  it('ordena por fecha de más reciente a más antigua por defecto', () => {
    pendingRequests.set([
      request({ id: 1, plate: 'AAA-111', date: '2026-03-01T10:00:00Z' }),
      request({ id: 2, plate: 'BBB-222', date: '2026-03-20T10:00:00Z' }),
      request({ id: 3, plate: 'CCC-333', date: '2026-03-10T10:00:00Z' }),
    ]);
    build();

    expect(plates()).toEqual(['BBB-222', 'CCC-333', 'AAA-111']);
  });

  it('permite invertir el orden por fecha', () => {
    pendingRequests.set([
      request({ id: 1, plate: 'AAA-111', date: '2026-03-01T10:00:00Z' }),
      request({ id: 2, plate: 'BBB-222', date: '2026-03-20T10:00:00Z' }),
      request({ id: 3, plate: 'CCC-333', date: '2026-03-10T10:00:00Z' }),
    ]);
    build();

    selectOption('#reviews-date-order', 'oldest');

    expect(plates()).toEqual(['AAA-111', 'CCC-333', 'BBB-222']);
  });

  it('filtra por ciclo', () => {
    pendingRequests.set([
      request({ id: 1, plate: 'AAA-111', cycle: '2026-1' }),
      request({ id: 2, plate: 'BBB-222', cycle: '2025-2' }),
      request({ id: 3, plate: 'CCC-333', cycle: '2025-2' }),
    ]);
    build();

    selectOption('#reviews-cycle', '2025-2');

    expect(plates()).toEqual(['CCC-333', 'BBB-222']);
  });

  it('busca por placa', () => {
    pendingRequests.set([
      request({ id: 1, plate: 'AAA-111' }),
      request({ id: 2, plate: 'XYZ-987' }),
    ]);
    build();

    search('xyz');

    expect(plates()).toEqual(['XYZ-987']);
  });

  it('busca por nombre del solicitante ignorando tildes', () => {
    pendingRequests.set([
      request({ id: 1, plate: 'AAA-111', name: 'Juan', lastName: 'Pérez' }),
      request({ id: 2, plate: 'BBB-222', name: 'Ana', lastName: 'Gómez' }),
    ]);
    build();

    search('ana gomez');

    expect(plates()).toEqual(['BBB-222']);
  });

  it('busca por usuario del solicitante', () => {
    pendingRequests.set([
      request({ id: 1, plate: 'AAA-111', username: 'U23201703' }),
      request({ id: 2, plate: 'BBB-222', username: 'U19004411' }),
    ]);
    build();

    search('U19004411');

    expect(plates()).toEqual(['BBB-222']);
  });

  it('vuelve a la primera página al cambiar un filtro', () => {
    pendingRequests.set(manyRequests(25));
    build();

    goToPage(3);
    search('ABC-001');

    expect(plates()).toEqual(['ABC-001']);
    expect(host().querySelector('.pagination__page--active')?.textContent?.trim()).toBe('1');
  });

  it('avisa cuando ninguna solicitud coincide con los filtros', () => {
    pendingRequests.set(manyRequests(5));
    build();

    search('no-existe');

    expect(rows().length).toBe(0);
    expect(host().textContent).toContain('Sin resultados para tu búsqueda');
  });

  it('limpia los filtros y recupera el listado completo', () => {
    pendingRequests.set(manyRequests(5));
    build();

    search('no-existe');
    host().querySelector<HTMLButtonElement>('.empty app-ui-button button')!.click();
    fixture.detectChanges();

    expect(rows().length).toBe(5);
  });

  it('aplica los filtros sobre las solicitudes revisadas', () => {
    pendingRequests.set([request({ id: 1, plate: 'AAA-111' })]);
    reviewedRequests.set([
      request({ id: 2, plate: 'BBB-222' }),
      request({ id: 3, plate: 'CCC-333' }),
    ]);
    build('revisadas');

    search('bbb');

    expect(plates()).toEqual(['BBB-222']);
  });

  it('no muestra los filtros cuando no hay solicitudes asignadas', () => {
    build();

    expect(host().querySelector('.filters')).toBeNull();
  });

  it('titula la vista de pendientes por el tipo de solicitud que atiende', () => {
    build();

    expect(host().querySelector('.page-header__title')?.textContent).toContain(
      'Ingreso al estacionamiento',
    );
  });

  it('titula la vista revisada como historial de revisiones', () => {
    build('revisadas');

    expect(host().querySelector('.page-header__title')?.textContent).toContain(
      'Historial de revisiones',
    );
  });

  it('no mezcla desasignaciones en la vista de pendientes', () => {
    pendingRequests.set([request({ id: 1, plate: 'AAA-111' })]);
    pendingAcceptorRequests.set([unassignment({ id: 2, plate: 'DES-002' })]);
    build();

    expect(plates()).toEqual(['AAA-111']);
  });

  it('avisa de las desasignaciones pendientes con un enlace a su bandeja', () => {
    pendingRequests.set([request({ id: 1 })]);
    pendingAcceptorRequests.set([unassignment({ id: 2 }), unassignment({ id: 3 })]);
    build();

    const crosslink = host().querySelector('.crosslink');
    expect(crosslink).not.toBeNull();
    expect(crosslink?.textContent).toContain('2');
    expect(crosslink?.getAttribute('href')).toBe('/revisiones-vehiculos');
  });

  it('no avisa de desasignaciones cuando no hay pendientes', () => {
    pendingRequests.set([request({ id: 1 })]);
    build();

    expect(host().querySelector('.crosslink')).toBeNull();
  });

  it('une ambos tipos de solicitud en el historial', () => {
    reviewedRequests.set([request({ id: 1, plate: 'AAA-111', status: 'APROBADO' })]);
    reviewedAcceptorRequests.set([unassignment({ id: 2, plate: 'DES-002' })]);
    build('revisadas');

    expect(plates()).toEqual(['DES-002', 'AAA-111']);
    expect(kinds()).toEqual(['Desasignación', 'Ingreso']);
  });

  it('filtra el historial por tipo de solicitud', () => {
    reviewedRequests.set([request({ id: 1, plate: 'AAA-111', status: 'APROBADO' })]);
    reviewedAcceptorRequests.set([unassignment({ id: 2, plate: 'DES-002' })]);
    build('revisadas');

    selectOption('#reviews-kind', 'unassignment');

    expect(plates()).toEqual(['DES-002']);
  });

  it('oculta el filtro de ciclo cuando solo se ven desasignaciones', () => {
    reviewedRequests.set([request({ id: 1, status: 'APROBADO' })]);
    reviewedAcceptorRequests.set([unassignment({ id: 2 })]);
    build('revisadas');

    expect(host().querySelector('#reviews-cycle')).not.toBeNull();

    selectOption('#reviews-kind', 'unassignment');

    expect(host().querySelector('#reviews-cycle')).toBeNull();
  });

  it('filtra el historial por resultado', () => {
    reviewedRequests.set([
      request({ id: 1, plate: 'AAA-111', status: 'APROBADO' }),
      request({ id: 2, plate: 'BBB-222', status: 'RECHAZADO' }),
    ]);
    build('revisadas');

    selectOption('#reviews-result', 'rejected');

    expect(plates()).toEqual(['BBB-222']);
  });

  it('no ofrece los filtros de tipo ni resultado en la vista de pendientes', () => {
    pendingRequests.set([request({ id: 1 })]);
    build();

    expect(host().querySelector('#reviews-kind')).toBeNull();
    expect(host().querySelector('#reviews-result')).toBeNull();
  });

  it('enlaza el detalle de cada tipo a su propia página', () => {
    reviewedRequests.set([request({ id: 1, plate: 'AAA-111', status: 'APROBADO' })]);
    reviewedAcceptorRequests.set([unassignment({ id: 2, plate: 'DES-002' })]);
    build('revisadas');

    const links = rows().map((row) => row.querySelector('a.reviews-table__link'));

    expect(links.every((link) => link !== null)).toBe(true);
    expect(links[0]?.getAttribute('href')).toBe('/revisiones-vehiculos/2');
    expect(links[1]?.getAttribute('href')).toBe('/revisiones/1');
  });

  it('no abre ningún modal para ver el detalle', () => {
    reviewedAcceptorRequests.set([unassignment({ id: 2, plate: 'DES-002' })]);
    build('revisadas');

    expect(host().querySelector('button.reviews-table__link')).toBeNull();
    expect(host().querySelector('app-ui-dialog')).toBeNull();
  });

  it('preselecciona el tipo recibido por query param', () => {
    reviewedRequests.set([request({ id: 1, plate: 'AAA-111', status: 'APROBADO' })]);
    reviewedAcceptorRequests.set([unassignment({ id: 2, plate: 'DES-002' })]);

    fixture = TestBed.createComponent(PendingReviewsPage);
    fixture.componentRef.setInput('vista', 'revisadas');
    fixture.componentRef.setInput('tipo', 'unassignment');
    fixture.detectChanges();

    expect(plates()).toEqual(['DES-002']);
  });
});
