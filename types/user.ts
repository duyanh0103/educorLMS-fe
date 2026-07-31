import type { Role } from "@/types/auth";

export interface UserListItem {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserDetail extends UserListItem {
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateUserPayload {
  username: string;
  fullName: string;
  email?: string;
  role: "TEACHER" | "STUDENT";
}

export interface CreateUserResponse {
  user: UserDetail;
  initialPassword: string;
}

export interface ResetPasswordResponse {
  newPassword: string;
}
