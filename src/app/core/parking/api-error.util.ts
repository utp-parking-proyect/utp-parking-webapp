import { HttpErrorResponse } from '@angular/common/http';
import { ApiException } from './models/api-exception.model';

const STATUS_MESSAGES: Record<number, string> = {
  0: 'No pudimos conectarnos con el servicio. Revisa tu conexión e inténtalo nuevamente.',
  400: 'Los datos enviados no son válidos. Revísalos e inténtalo nuevamente.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos la información solicitada.',
  409: 'No pudimos registrar la solicitud con los datos enviados.',
  503: 'El servicio no está disponible en este momento. Inténtalo más tarde.',
  504: 'El servicio tardó demasiado en responder. Inténtalo nuevamente.',
};

const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Inténtalo nuevamente en unos minutos.';

export function apiErrorMessage(error: HttpErrorResponse): string {
  const description = (error.error as ApiException | null)?.description?.trim();
  return description || STATUS_MESSAGES[error.status] || DEFAULT_MESSAGE;
}
