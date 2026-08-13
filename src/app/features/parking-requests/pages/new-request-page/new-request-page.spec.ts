import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ParkingRequestService } from '../../../../core/parking/parking-request.service';
import { NewRequestPage } from './new-request-page';

describe('NewRequestPage plate validation', () => {
  let fixture: ComponentFixture<NewRequestPage>;

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function selectVehicleType(label: string): void {
    const select = host().querySelector<HTMLSelectElement>('#vehicle-type')!;
    const option = Array.from(select.options).find((item) => item.textContent?.trim() === label)!;
    select.value = option.value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function typePlate(value: string): void {
    const input = host().querySelector<HTMLInputElement>('#number-plate')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function fieldError(): string {
    const errors = host().querySelectorAll<HTMLElement>('.ui-field__error');
    return errors[errors.length - 1]?.textContent?.trim() ?? '';
  }

  function plateValue(): string {
    return host().querySelector<HTMLInputElement>('#number-plate')!.value;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NewRequestPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ParkingRequestService,
          useValue: {
            vehicles: signal([]),
            requests: signal([]),
            isLoading: signal(false),
            hasFailed: signal(true),
            create: () => ({ subscribe: () => undefined }),
            reload: () => undefined,
          },
        },
      ],
    });

    fixture = TestBed.createComponent(NewRequestPage);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('acepta una placa 2-4 cuando el tipo es motocicleta', () => {
    selectVehicleType('Motocicleta');
    typePlate('AB1234');

    expect(plateValue()).toBe('AB-1234');
    expect(fieldError()).toBe('');
  });

  it('pide el formato de motocicleta, no el de automóvil, ante una placa incompleta', () => {
    selectVehicleType('Motocicleta');
    typePlate('AB123');

    expect(plateValue()).toBe('AB-123');
    expect(fieldError()).toContain('motocicleta');
  });

  it('pide el formato de automóvil cuando el tipo es automóvil', () => {
    selectVehicleType('Automóvil');
    typePlate('AB12');

    expect(fieldError()).toContain('automóvil');
  });

  it('acepta una placa 3-3 cuando el tipo es automóvil', () => {
    selectVehicleType('Automóvil');
    typePlate('ABC123');

    expect(plateValue()).toBe('ABC-123');
    expect(fieldError()).toBe('');
  });

  it('acepta una placa 3-3 cuando el tipo es camioneta', () => {
    selectVehicleType('Camioneta');
    typePlate('ABC123');

    expect(plateValue()).toBe('ABC-123');
    expect(fieldError()).toBe('');
  });
});
