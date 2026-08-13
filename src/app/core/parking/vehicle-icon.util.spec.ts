import { vehicleIconFor } from './vehicle-icon.util';

describe('vehicleIconFor', () => {
  it('usa el icono de moto para la motocicleta', () => {
    expect(vehicleIconFor('MOTOCICLETA')).toBe('motorcycle');
    expect(vehicleIconFor('Motocicleta')).toBe('motorcycle');
  });

  it('usa el icono de camioneta', () => {
    expect(vehicleIconFor('CAMIONETA')).toBe('pickup');
    expect(vehicleIconFor('Camioneta')).toBe('pickup');
  });

  it('usa el icono de auto para automóvil, con o sin tilde', () => {
    expect(vehicleIconFor('AUTOMOVIL')).toBe('car');
    expect(vehicleIconFor('Automóvil')).toBe('car');
  });

  it('cae en el icono de auto ante un tipo desconocido o vacío', () => {
    expect(vehicleIconFor('CUATRIMOTO DE CARGA')).toBe('motorcycle');
    expect(vehicleIconFor('FURGONETA')).toBe('car');
    expect(vehicleIconFor(null)).toBe('car');
    expect(vehicleIconFor(undefined)).toBe('car');
    expect(vehicleIconFor('')).toBe('car');
  });
});
