import { IconName } from '../../shared/components/ui-icon/ui-icon';

export function vehicleIconFor(vehicleType: string | null | undefined): IconName {
  const normalized = (vehicleType ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();

  if (normalized.includes('MOTO')) {
    return 'motorcycle';
  }
  if (normalized.includes('CAMIONETA')) {
    return 'pickup';
  }
  return 'car';
}
