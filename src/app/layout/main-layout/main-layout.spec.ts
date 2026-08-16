import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CurrentUserService } from '../../core/portal/current-user.service';
import { MainLayout } from './main-layout';
import { NAV_GUIDE_DESCRIPTIONS } from './nav-guide-content';

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  let roles: WritableSignal<string[]>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return host().textContent ?? '';
  }

  function build(): void {
    fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
  }

  function helpButton(): HTMLButtonElement | null {
    return host().querySelector<HTMLButtonElement>('.shell__help');
  }

  function navLabels(): string[] {
    return [...host().querySelectorAll<HTMLElement>('.shell__nav-label')].map(
      (label) => label.textContent?.trim() ?? '',
    );
  }

  function guide(): HTMLElement | null {
    return host().querySelector<HTMLElement>('.nav-guide__popover');
  }

  function guideButton(label: string): HTMLButtonElement {
    return [...host().querySelectorAll<HTMLButtonElement>('.nav-guide__actions button')].find(
      (button) => button.textContent?.trim() === label,
    )!;
  }

  function openGuide(): void {
    helpButton()!.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    roles = signal(['ROLE_STUDENT']);

    TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { roles, username: signal('U23201703'), logout: () => undefined },
        },
        {
          provide: CurrentUserService,
          useValue: { displayName: signal('Jose Pérez'), firstName: signal('Jose') },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('ofrece la guía al estudiante junto a su rol', () => {
    build();

    expect(helpButton()).not.toBeNull();
    expect(helpButton()?.getAttribute('aria-label')).toContain('guía');
  });

  it('no ofrece la guía a Personal SAE todavía', () => {
    roles.set(['ROLE_SAE']);
    build();

    expect(helpButton()).toBeNull();
  });

  it('no ofrece la guía a Personal de Seguridad todavía', () => {
    roles.set(['ROLE_SECURITY']);
    build();

    expect(helpButton()).toBeNull();
  });

  it('no muestra la guía hasta que el usuario la abre', () => {
    build();

    expect(guide()).toBeNull();
  });

  it('abre la guía en el primer item del sidebar', () => {
    build();
    openGuide();

    expect(guide()).not.toBeNull();
    expect(text()).toContain('1/5');
    expect(guide()?.textContent).toContain('Inicio');
    expect(guide()?.textContent).toContain(NAV_GUIDE_DESCRIPTIONS['Inicio']);
  });

  it('cubre todos los items del sidebar del estudiante', () => {
    build();

    const labels = navLabels();
    expect(labels.length).toBe(5);
    for (const label of labels) {
      expect(NAV_GUIDE_DESCRIPTIONS[label]).toBeDefined();
    }
  });

  it('avanza item por item con Continuar', () => {
    build();
    openGuide();

    guideButton('Continuar').click();
    fixture.detectChanges();

    expect(text()).toContain('2/5');
    expect(guide()?.textContent).toContain('Nueva solicitud');
    expect(guide()?.textContent).toContain(NAV_GUIDE_DESCRIPTIONS['Nueva solicitud']);
  });

  it('cierra la guía al terminar el último item', () => {
    build();
    openGuide();

    for (let step = 1; step < 5; step += 1) {
      guideButton('Continuar').click();
      fixture.detectChanges();
    }

    expect(text()).toContain('5/5');
    expect(guide()?.textContent).toContain('Historial');

    guideButton('Entendido').click();
    fixture.detectChanges();

    expect(guide()).toBeNull();
  });

  it('cierra la guía con Salir', () => {
    build();
    openGuide();
    guideButton('Continuar').click();
    fixture.detectChanges();

    guideButton('Salir').click();
    fixture.detectChanges();

    expect(guide()).toBeNull();
  });

  it('reinicia la guía en el primer item al volver a abrirla', () => {
    build();
    openGuide();
    guideButton('Continuar').click();
    fixture.detectChanges();
    guideButton('Salir').click();
    fixture.detectChanges();

    openGuide();

    expect(text()).toContain('1/5');
  });
});
