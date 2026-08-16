import { statusLabel } from './status-labels';

describe('statusLabel', () => {
  it('pone la tilde al estado que la base de datos guarda en ASCII', () => {
    expect(statusLabel('EN_REVISION')).toBe('EN REVISIÓN');
  });

  it('tolera variantes de formato del mismo estado', () => {
    expect(statusLabel('en_revision')).toBe('EN REVISIÓN');
    expect(statusLabel('EN REVISION')).toBe('EN REVISIÓN');
    expect(statusLabel('  EN_REVISIÓN  ')).toBe('EN REVISIÓN');
  });

  it('deja pasar los estados que no necesitan traducción', () => {
    expect(statusLabel('APROBADO')).toBe('APROBADO');
    expect(statusLabel('RECHAZADO')).toBe('RECHAZADO');
    expect(statusLabel('REENVIADO')).toBe('REENVIADO');
  });

  it('hace legible un estado desconocido en lugar de romperse', () => {
    expect(statusLabel('PENDIENTE_DE_PAGO')).toBe('PENDIENTE DE PAGO');
  });

  it('devuelve vacío si el backend no envía estado', () => {
    expect(statusLabel(null)).toBe('');
    expect(statusLabel(undefined)).toBe('');
    expect(statusLabel('   ')).toBe('');
  });
});
