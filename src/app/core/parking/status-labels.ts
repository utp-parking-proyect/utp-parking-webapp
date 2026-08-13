const STATUS_LABELS: Readonly<Record<string, string>> = {
  EN_REVISION: 'EN REVISIÓN',
};

function normalizeKey(status: string): string {
  return status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function statusLabel(status: string | null | undefined): string {
  if (!status?.trim()) {
    return '';
  }

  return STATUS_LABELS[normalizeKey(status)] ?? status.replace(/_/g, ' ');
}
