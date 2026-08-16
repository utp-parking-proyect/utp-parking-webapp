import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiAlert } from './ui-alert';

describe('UiAlert', () => {
  let fixture: ComponentFixture<UiAlert>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function closeButton(): HTMLButtonElement | null {
    return host().querySelector<HTMLButtonElement>('.ui-alert__close');
  }

  function build(dismissible?: boolean): void {
    fixture = TestBed.createComponent(UiAlert);
    if (dismissible !== undefined) {
      fixture.componentRef.setInput('dismissible', dismissible);
    }
    fixture.detectChanges();
  }

  function dismissAndSettle(): void {
    closeButton()!.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(260);
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [UiAlert] });
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('ofrece el botón de cierre por defecto', () => {
    build();

    expect(closeButton()).not.toBeNull();
    expect(closeButton()?.getAttribute('aria-label')).toBe('Cerrar aviso');
  });

  it('permite ocultar el botón de cierre', () => {
    build(false);

    expect(closeButton()).toBeNull();
  });

  it('marca la salida antes de desaparecer', () => {
    build();

    closeButton()!.click();
    fixture.detectChanges();

    expect(host().classList).toContain('ui-alert--leaving');
    expect(host().classList).not.toContain('ui-alert--dismissed');
  });

  it('se oculta al terminar la animación de salida', () => {
    build();
    dismissAndSettle();

    expect(host().classList).toContain('ui-alert--dismissed');
    expect(host().classList).not.toContain('ui-alert--leaving');
  });

  it('emite el cierre solo cuando la animación termina', () => {
    build();

    const emitted: number[] = [];
    fixture.componentInstance.closed.subscribe(() => emitted.push(1));

    closeButton()!.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(0);

    vi.advanceTimersByTime(260);
    fixture.detectChanges();
    expect(emitted.length).toBe(1);
  });

  it('ignora clics repetidos durante la salida', () => {
    build();

    const emitted: number[] = [];
    fixture.componentInstance.closed.subscribe(() => emitted.push(1));

    closeButton()!.click();
    closeButton()!.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(260);
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
  });

  it('conserva el tono en la clase del anfitrión', () => {
    fixture = TestBed.createComponent(UiAlert);
    fixture.componentRef.setInput('tone', 'danger');
    fixture.detectChanges();

    expect(fixture.nativeElement.classList).toContain('ui-alert--danger');

    dismissAndSettle();

    expect(fixture.nativeElement.classList).toContain('ui-alert--danger');
    expect(fixture.nativeElement.classList).toContain('ui-alert--dismissed');
  });
});
