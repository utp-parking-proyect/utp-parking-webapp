export const ROLE_LABELS: Readonly<Record<string, string>> = {
  ROLE_STUDENT: 'Estudiante',
  ROLE_TEACHER: 'Docente',
  ROLE_ADMINISTRATIVE: 'Administrativo',
  ROLE_SAE: 'Personal SAE',
  ROLE_SECURITY: 'Seguridad',
  ROLE_SECURITY_ADMIN: 'Administrador de seguridad',
};

export function roleLabel(role: string): string {
  const known = ROLE_LABELS[role];
  if (known) {
    return known;
  }

  const readable = role.replace(/^ROLE_/, '').replace(/_/g, ' ').trim().toLowerCase();
  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : role;
}
