import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, retry, share, timer } from 'rxjs';
import { WebSocketSubjectConfig, webSocket } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../auth/token-storage.service';
import {
  PARKING_AVAILABILITY_SOCKET_PATH,
  REALTIME_RECONNECT_BASE_DELAY_MS,
  REALTIME_RECONNECT_MAX_DELAY_MS,
} from './control.constants';
import { LocationAvailability } from './models/parking-availability.model';

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export type ControlSocketFactory = (
  config: WebSocketSubjectConfig<LocationAvailability>,
) => Observable<LocationAvailability>;

export const CONTROL_SOCKET_FACTORY = new InjectionToken<ControlSocketFactory>(
  'CONTROL_SOCKET_FACTORY',
  {
    providedIn: 'root',
    factory: () => (config) => webSocket(config),
  },
);

function socketOrigin(): string {
  if (environment.gatewayUrl) {
    return environment.gatewayUrl.replace(/^http/, 'ws');
  }
  return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`;
}

@Injectable({ providedIn: 'root' })
export class ParkingControlRealtimeService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly socketFactory = inject(CONTROL_SOCKET_FACTORY);

  private readonly _status = signal<RealtimeStatus>('idle');
  private listening = false;

  readonly status = this._status.asReadonly();
  readonly isConnected = computed(() => this._status() === 'connected');

  readonly availabilityChanges: Observable<LocationAvailability> = defer(() => {
    this.listening = true;
    this._status.set('connecting');
    return this.socketFactory(this.socketConfig());
  }).pipe(
    retry({
      delay: (_error, retryCount) => {
        this._status.set('reconnecting');
        return timer(this.reconnectDelay(retryCount));
      },
    }),
    finalize(() => {
      this.listening = false;
      this._status.set('idle');
    }),
    share({ resetOnRefCountZero: true }),
  );

  private socketConfig(): WebSocketSubjectConfig<LocationAvailability> {
    return {
      url: this.socketUrl(),
      openObserver: { next: () => this._status.set('connected') },
      closeObserver: {
        next: () => {
          if (this.listening) {
            this._status.set('reconnecting');
          }
        },
      },
    };
  }

  private socketUrl(): string {
    const token = this.tokenStorage.getToken();
    const url = `${socketOrigin()}${PARKING_AVAILABILITY_SOCKET_PATH}`;
    return token ? `${url}?access_token=${encodeURIComponent(token)}` : url;
  }

  private reconnectDelay(retryCount: number): number {
    const delay = REALTIME_RECONNECT_BASE_DELAY_MS * 2 ** (retryCount - 1);
    return Math.min(delay, REALTIME_RECONNECT_MAX_DELAY_MS);
  }
}
