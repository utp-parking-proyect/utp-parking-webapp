export interface UserRole {
  idRole: number;
  name: string;
}

export interface UserCampus {
  idCampus: number;
  nameCampus: string;
}

export interface UserProfile {
  idUser: number;
  username: string;
  name: string;
  lastname: string;
  dni: string;
  institutionalEmail: string;
  career: string;
  actualRegistered: boolean;
  roles: UserRole[];
  campus: UserCampus | null;
}
