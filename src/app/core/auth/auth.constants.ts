export const ROLE_SAE = 'ROLE_SAE';

export const ROLE_STUDENT = 'ROLE_STUDENT';

export const ROLE_TEACHER = 'ROLE_TEACHER';

export const ROLE_ADMINISTRATIVE = 'ROLE_ADMINISTRATIVE';

export const ROLE_SECURITY = 'ROLE_SECURITY';

export const APPLICANT_ROLES = [ROLE_STUDENT, ROLE_TEACHER, ROLE_ADMINISTRATIVE] as const;

export const AUTHENTICATE_PATH = '/gateway/authentication/api/auth/authenticate';

export const AUTH_TOKEN_STORAGE_KEY = 'utp_parking_auth_token';
