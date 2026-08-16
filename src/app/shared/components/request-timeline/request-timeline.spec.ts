import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowEntry } from '../../../core/parking/models/parking-request.model';
import { RequestTimeline } from './request-timeline';

const ENTRIES: WorkflowEntry[] = [
  { status: 'REGISTRADO', dateStatusChange: '2026-06-01T09:10:00Z', observation: null },
  { status: 'EN_REVISION', dateStatusChange: '2026-06-01T09:11:00Z', observation: null },
  { status: 'RECHAZADO', dateStatusChange: '2026-06-02T16:20:00Z', observation: 'Sin validez' },
];

describe('RequestTimeline', () => {
  let fixture: ComponentFixture<RequestTimeline>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function renderedStatuses(): string[] {
    return Array.from(host().querySelectorAll<HTMLElement>('.timeline__status')).map(
      (element) => element.textContent?.trim() ?? '',
    );
  }

  function toggle(): void {
    host().querySelector<HTMLButtonElement>('.timeline__order')?.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RequestTimeline] });
    fixture = TestBed.createComponent(RequestTimeline);
    fixture.componentRef.setInput('entries', ENTRIES);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('empieza mostrando el cambio más reciente arriba', () => {
    expect(renderedStatuses()).toEqual(['RECHAZADO', 'EN REVISIÓN', 'REGISTRADO']);
  });

  it('invierte el orden al pulsar el control', () => {
    toggle();
    expect(renderedStatuses()).toEqual(['REGISTRADO', 'EN REVISIÓN', 'RECHAZADO']);
  });

  it('vuelve al orden inicial al pulsarlo de nuevo', () => {
    toggle();
    toggle();
    expect(renderedStatuses()).toEqual(['RECHAZADO', 'EN REVISIÓN', 'REGISTRADO']);
  });

  it('no altera el arreglo recibido', () => {
    toggle();
    expect(ENTRIES.map((entry) => entry.status)).toEqual([
      'REGISTRADO',
      'EN_REVISION',
      'RECHAZADO',
    ]);
  });
});
