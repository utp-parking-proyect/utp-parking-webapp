import { TestBed } from '@angular/core/testing';
import { Observable, Subject, Subscription } from 'rxjs';
import { WebSocketSubjectConfig } from 'rxjs/webSocket';
import { TokenStorageService } from '../auth/token-storage.service';
import { LocationAvailability } from './models/parking-availability.model';
import {
  CONTROL_SOCKET_FACTORY,
  ParkingControlRealtimeService,
} from './parking-control-realtime.service';

const AVAILABILITY: LocationAvailability = {
  locationId: 1,
  locationName: 'Sede Arequipa',
  campusId: 1,
  campusName: 'Lima Centro',
  capacity: 75,
  occupied: 43,
  available: 32,
};

describe('ParkingControlRealtimeService', () => {
  let service: ParkingControlRealtimeService;
  let configs: WebSocketSubjectConfig<LocationAvailability>[];
  let sockets: Subject<LocationAvailability>[];

  beforeEach(() => {
    configs = [];
    sockets = [];

    TestBed.configureTestingModule({
      providers: [
        { provide: TokenStorageService, useValue: { getToken: () => 'jwt-token' } },
        {
          provide: CONTROL_SOCKET_FACTORY,
          useValue: (config: WebSocketSubjectConfig<LocationAvailability>) => {
            configs.push(config);
            const socket = new Subject<LocationAvailability>();
            sockets.push(socket);
            return socket.asObservable() as Observable<LocationAvailability>;
          },
        },
      ],
    });

    service = TestBed.inject(ParkingControlRealtimeService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function connect(): { subscription: Subscription; events: LocationAvailability[] } {
    const events: LocationAvailability[] = [];
    const subscription = service.availabilityChanges.subscribe((event) => events.push(event));
    return { subscription, events };
  }

  it('no abre la conexión hasta que alguien la escucha', () => {
    expect(configs.length).toBe(0);
    expect(service.status()).toBe('idle');
  });

  it('envía el token de la sesión en la url del WebSocket', () => {
    const { subscription } = connect();

    expect(configs.length).toBe(1);
    expect(configs[0].url).toContain('/gateway/utp-parking/control/availability/ws');
    expect(configs[0].url).toContain('access_token=jwt-token');
    expect(configs[0].url.startsWith('ws')).toBe(true);

    subscription.unsubscribe();
  });

  it('marca la conexión como conectada al abrirse y emite los eventos recibidos', () => {
    const { subscription, events } = connect();

    expect(service.status()).toBe('connecting');

    configs[0].openObserver?.next?.(new Event('open'));
    expect(service.status()).toBe('connected');
    expect(service.isConnected()).toBe(true);

    sockets[0].next(AVAILABILITY);
    expect(events).toEqual([AVAILABILITY]);

    subscription.unsubscribe();
  });

  it('comparte una única conexión entre todos los suscriptores', () => {
    const first = connect();
    const second = connect();

    expect(configs.length).toBe(1);

    sockets[0].next(AVAILABILITY);
    expect(first.events.length).toBe(1);
    expect(second.events.length).toBe(1);

    first.subscription.unsubscribe();
    second.subscription.unsubscribe();
  });

  it('marca reconexión cuando la conexión se pierde', () => {
    const { subscription } = connect();

    configs[0].openObserver?.next?.(new Event('open'));
    configs[0].closeObserver?.next?.(new CloseEvent('close'));

    expect(service.status()).toBe('reconnecting');

    subscription.unsubscribe();
  });

  it('vuelve a estado inactivo cuando ya nadie escucha', () => {
    const { subscription } = connect();

    configs[0].openObserver?.next?.(new Event('open'));
    subscription.unsubscribe();

    expect(service.status()).toBe('idle');
  });
});
