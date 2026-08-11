/**
 * Nombres legibles de los roles que emite el JWT (`ROLE_*`, según los definidos en el
 * api-gateway). Es un mapa y no un enum a propósito: los roles nacen en el backend, así que
 * necesitamos tolerar valores que este front todavía no conoce en lugar de romper la vista.
 */
export const ROLE_LABELS: Readonly<Record<string, string>> = {
  ROLE_STUDENT: 'Estudiante',
  ROLE_TEACHER: 'Docente',
  ROLE_ADMINISTRATIVE: 'Administrativo',
  ROLE_SAE: 'Personal SAE',
  ROLE_SECURITY: 'Seguridad',
  ROLE_SECURITY_ADMIN: 'Administrador de seguridad',
};

/**
 * Etiqueta de un rol. Si aparece uno nuevo en el backend, lo muestra presentable
 * (`ROLE_PARKING_ADMIN` → «Parking admin») en vez del identificador crudo.
 */
export function roleLabel(role: string): string {
  const known = ROLE_LABELS[role];
  if (known) {
    return known;
  }

  const readable = role.replace(/^ROLE_/, '').replace(/_/g, ' ').trim().toLowerCase();
  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : role;
}
