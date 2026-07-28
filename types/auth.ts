export type Role = "SUPER_ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
