import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CurrentUserService } from '../portal/current-user.service';
import { ParkingRequestDetailService } from './parking-request-detail.service';
import { ParkingRequestService } from './parking-request.service';
import { PARKING_REQUEST_PATH } from './parking.constants';

const REQUESTS_URL = `${environment.gatewayUrl}${PARKING_REQUEST_PATH}`;

describe('ParkingRequestService.resubmit', () => {
  let service: ParkingRequestService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: CurrentUserService,
          useValue: {
            userId: signal(null),
            isLoading: signal(false),
            hasFailed: signal(false),
          },
        },
      ],
    });

    service = TestBed.inject(ParkingRequestService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('usa la ruta de reenvío definida en el contrato', () => {
    service.resubmit(12).subscribe();

    const request = httpTesting.expectOne(`${REQUESTS_URL}/12/resubmit`);
    expect(request.request.method).toBe('POST');
    request.flush({ parkingRequestId: 12 });
  });

  it('envía la observación cuando el usuario la escribe', () => {
    service.resubmit(12, { observation: 'Documentación corregida' }).subscribe();

    const request = httpTesting.expectOne(`${REQUESTS_URL}/12/resubmit`);
    expect(request.request.body).toEqual({ observation: 'Documentación corregida' });
    request.flush({ parkingRequestId: 12 });
  });

  it('omite el cuerpo cuando no hay observación, porque el contrato lo declara opcional', () => {
    service.resubmit(12).subscribe();

    const request = httpTesting.expectOne(`${REQUESTS_URL}/12/resubmit`);
    expect(request.request.body).toBeNull();
    request.flush({ parkingRequestId: 12 });
  });

  it('consulta el detalle por id al seleccionar una solicitud', () => {
    TestBed.inject(ParkingRequestDetailService).select(12);
    TestBed.tick();

    const request = httpTesting.expectOne(`${REQUESTS_URL}/12`);
    expect(request.request.method).toBe('GET');
    request.flush({ idRequest: 12, workflow: [] });
  });

  it('no consulta el detalle mientras no haya solicitud seleccionada', () => {
    TestBed.inject(ParkingRequestDetailService).select(null);
    TestBed.tick();

    httpTesting.expectNone(`${REQUESTS_URL}/null`);
  });
});
