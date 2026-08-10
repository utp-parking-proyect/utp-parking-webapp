export interface JwtClaims {
  sub: string;
  roles: string[];
  userId: number | null;
  iss: string;
  iat: number;
  exp: number;
}
