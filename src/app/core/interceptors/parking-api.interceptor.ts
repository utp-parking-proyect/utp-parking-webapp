import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  PARKING_API_PATH,
  PARKING_APP_CODE,
  PARKING_CALLER_NAME,
} from '../parking/parking.constants';

const PARKING_API_URL = `${environment.gatewayUrl}${PARKING_API_PATH}`;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

function newRequestId(): string {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function formatRequestDate(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? '-' : '+';
  const offset = Math.abs(offsetMinutes);

  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  return `${day}T${time}.${pad(date.getMilliseconds(), 3)}${sign}${pad(Math.floor(offset / 60))}${pad(offset % 60)}`;
}

export const parkingApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(PARKING_API_URL)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'Request-ID': newRequestId(),
        'request-date': formatRequestDate(new Date()),
        'app-code': PARKING_APP_CODE,
        'caller-name': PARKING_CALLER_NAME,
      },
    }),
  );
};
