export interface Course {
  id: string;
  title: string;
}

export interface EnrolledClass {
  id: string;
  name: string;
  isActive: boolean;
  course: Course;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: "ACTIVE" | string;
  createdAt: string;
  updatedAt: string;
  class: EnrolledClass;
}

export interface ClassTeacher {
  id: string;
  classId: string;
  teacherId: string;
  isPrimary: boolean;
  createdAt: string;
  teacher: {
    id: string;
    fullName: string;
    username: string;
    email: string | null;
  };
}

export interface ClassListItem {
  id: string;
  name: string;
  courseId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  course: { id: string; title: string };
  teachers: ClassTeacher[];
  _count: { enrollments: number };
}

export interface CreateClassPayload {
  name: string;
  courseId: string;
  teacherIds?: string[];
  primaryTeacherId?: string;
}

export interface UpdateClassPayload {
  name?: string;
  isActive?: boolean;
}

export interface UpdateClassTeachersPayload {
  teacherIds: string[];
  primaryTeacherId?: string;
}
