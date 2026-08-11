export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  userId: number | null;
}
