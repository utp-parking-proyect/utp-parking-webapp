import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ParkingRequestInformation } from '../../../../core/parking/models/parking-request.model';
import { RequestCard } from './request-card';

function request(status: string, numberCycle: string): ParkingRequestInformation {
  return {
    idRequest: 7,
    applicant: {
      idApplicant: 10,
      nameApplicant: 'Juan',
      lastNameApplicant: 'Pérez',
      usernameApplicant: 'U23201703',
      numberCycle,
    },
    vehicle: { numberPlate: 'ABC-123', vehicleType: 'Automóvil' },
    dateRequest: '2026-03-01T10:00:00Z',
    dateResponse: '2026-03-02T10:00:00Z',
    status,
  };
}

describe('RequestCard resubmit availability', () => {
  let fixture: ComponentFixture<RequestCard>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function resubmitButton(): HTMLButtonElement | null {
    return host().querySelector<HTMLButtonElement>('.rejection button');
  }

  function build(
    value: ParkingRequestInformation,
    currentCycle: string | null,
    actionable = true,
  ): void {
    fixture = TestBed.createComponent(RequestCard);
    fixture.componentRef.setInput('request', value);
    fixture.componentRef.setInput('actionable', actionable);
    fixture.componentRef.setInput('currentCycle', currentCycle);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RequestCard],
      providers: [provideRouter([])],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('ofrece reenviar una solicitud rechazada del ciclo vigente', () => {
    build(request('Rechazada', '2026-1'), '2026-1');

    expect(resubmitButton()?.textContent).toContain('Reenviar solicitud');
  });

  it('no ofrece reenviar una solicitud rechazada de un ciclo anterior', () => {
    build(request('Rechazada', '2025-2'), '2026-1');

    expect(resubmitButton()).toBeNull();
    expect(host().textContent).toContain('pertenece al ciclo 2025-2 y ya no puede reenviarse');
  });

  it('mantiene visible el aviso de rechazo aunque el ciclo esté cerrado', () => {
    build(request('Rechazada', '2025-2'), '2026-1');

    expect(host().querySelector('.rejection')).not.toBeNull();
    expect(host().textContent).toContain('Solicitud rechazada');
  });

  it('no ofrece reenviar mientras el ciclo vigente no se conoce', () => {
    build(request('Rechazada', '2026-1'), null);

    expect(resubmitButton()).toBeNull();
  });

  it('no ofrece reenviar una solicitud aprobada del ciclo vigente', () => {
    build(request('Aprobada', '2026-1'), '2026-1');

    expect(host().querySelector('.rejection')).toBeNull();
  });

  it('no ofrece reenviar cuando la tarjeta no es accionable', () => {
    build(request('Rechazada', '2026-1'), '2026-1', false);

    expect(host().querySelector('.rejection')).toBeNull();
  });
});
