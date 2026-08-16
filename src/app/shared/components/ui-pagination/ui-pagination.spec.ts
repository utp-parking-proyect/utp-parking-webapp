import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiPagination } from './ui-pagination';

describe('UiPagination', () => {
  let fixture: ComponentFixture<UiPagination>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function pageLabels(): string[] {
    return [...host().querySelectorAll('.pagination__page, .pagination__gap')].map(
      (element) => element.textContent?.trim() ?? '',
    );
  }

  function build(page: number, totalItems: number, pageSize = 10): void {
    fixture = TestBed.createComponent(UiPagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('totalItems', totalItems);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UiPagination] });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra el rango de elementos de la página actual', () => {
    build(2, 25);

    expect(host().textContent).toContain('11');
    expect(host().textContent).toContain('20');
    expect(host().textContent).toContain('25');
  });

  it('calcula el total de páginas y numera cada una', () => {
    build(1, 25);

    expect(pageLabels()).toEqual(['1', '2', '3']);
  });

  it('resume las páginas intermedias cuando hay muchas', () => {
    build(6, 120);

    expect(pageLabels()).toEqual(['1', '…', '5', '6', '7', '…', '12']);
  });

  it('deshabilita las flechas en los extremos', () => {
    build(1, 25);

    const arrows = host().querySelectorAll<HTMLButtonElement>('.pagination__arrow');
    expect(arrows[0].disabled).toBe(true);
    expect(arrows[1].disabled).toBe(false);
  });

  it('emite la página seleccionada', () => {
    build(1, 25);

    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));

    host().querySelectorAll<HTMLButtonElement>('.pagination__page')[2].click();

    expect(emitted).toEqual([3]);
  });

  it('no emite al pulsar la página activa', () => {
    build(1, 25);

    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));

    host().querySelectorAll<HTMLButtonElement>('.pagination__page')[0].click();

    expect(emitted).toEqual([]);
  });

  it('acota la página recibida al total disponible', () => {
    build(9, 25);

    expect(host().querySelector('.pagination__page--active')?.textContent?.trim()).toBe('3');
  });

  it('muestra un rango vacío cuando no hay elementos', () => {
    build(1, 0);

    expect(host().querySelector('.pagination__summary')?.textContent).toContain('0');
  });
});
