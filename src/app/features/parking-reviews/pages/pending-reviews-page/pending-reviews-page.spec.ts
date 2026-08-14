import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { ParkingReviewService } from '../../../../core/parking/parking-review.service';
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
    status: 'En revisión',
  };
}

function manyRequests(total: number): ParkingRequestInformation[] {
  return Array.from({ length: total }, (_, index) => request({ id: index + 1 }));
}

describe('PendingReviewsPage filtros y paginado', () => {
  let fixture: ComponentFixture<PendingReviewsPage>;
  const pendingRequests = signal<ParkingRequestInformation[]>([]);
  const reviewedRequests = signal<ParkingRequestInformation[]>([]);

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
});
