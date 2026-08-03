export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { classes: number };
}

export interface CreateCoursePayload {
  title: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
}
