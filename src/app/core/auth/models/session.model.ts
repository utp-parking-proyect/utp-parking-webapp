export interface Session {
  token: string;
  username: string;
  userId: number | null;
  roles: string[];
}
