import { formatPlate, isMotorcycleType, isValidPlate, plateExampleFor } from './number-plate.util';

const CAR = 1;
const MOTORCYCLE = 2;
const PICKUP = 3;

describe('isMotorcycleType', () => {
  it('reconoce la motocicleta', () => {
    expect(isMotorcycleType(MOTORCYCLE)).toBe(true);
  });

  it('no confunde automóvil ni camioneta con moto', () => {
    expect(isMotorcycleType(CAR)).toBe(false);
    expect(isMotorcycleType(PICKUP)).toBe(false);
    expect(isMotorcycleType(null)).toBe(false);
  });
});

describe('isValidPlate', () => {
  it('exige 3-3 para automóvil y camioneta', () => {
    expect(isValidPlate('ABC-123', CAR)).toBe(true);
    expect(isValidPlate('ABC-123', PICKUP)).toBe(true);
    expect(isValidPlate('AB-1234', CAR)).toBe(false);
    expect(isValidPlate('AB-1234', PICKUP)).toBe(false);
  });

  it('exige 2-4 para la motocicleta', () => {
    expect(isValidPlate('AB-1234', MOTORCYCLE)).toBe(true);
    expect(isValidPlate('ABC-123', MOTORCYCLE)).toBe(false);
  });

  it('rechaza la placa sin guion, como hace el backend', () => {
    expect(isValidPlate('ABC123', CAR)).toBe(false);
    expect(isValidPlate('AB1234', MOTORCYCLE)).toBe(false);
  });

  it('rechaza caracteres fuera de A-Z y 0-9', () => {
    expect(isValidPlate('ÁBC-123', CAR)).toBe(false);
    expect(isValidPlate('abc-123', CAR)).toBe(false);
  });
});

describe('formatPlate', () => {
  it('coloca el guion según el tipo elegido', () => {
    expect(formatPlate('abc123', CAR)).toBe('ABC-123');
    expect(formatPlate('ab1234', MOTORCYCLE)).toBe('AB-1234');
  });

  it('reubica el guion al cambiar de tipo', () => {
    expect(formatPlate('ABC-123', MOTORCYCLE)).toBe('AB-C123');
    expect(formatPlate('AB-1234', CAR)).toBe('AB1-234');
  });

  it('no fuerza el guion mientras no haya tipo', () => {
    expect(formatPlate('abc123', null)).toBe('ABC123');
  });

  it('descarta caracteres inválidos y recorta el exceso', () => {
    expect(formatPlate('a b*c-1 2 3', CAR)).toBe('ABC-123');
    expect(formatPlate('ABC1234567', CAR)).toBe('ABC-123');
  });

  it('deja escribir el prefijo sin añadir el guion todavía', () => {
    expect(formatPlate('AB', CAR)).toBe('AB');
    expect(formatPlate('A', MOTORCYCLE)).toBe('A');
  });
});

describe('plateExampleFor', () => {
  it('muestra el ejemplo que corresponde al tipo', () => {
    expect(plateExampleFor(CAR)).toBe('ABC-123');
    expect(plateExampleFor(MOTORCYCLE)).toBe('AB-1234');
  });
});
