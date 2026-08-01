export interface EnrolledStudent {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface EnrollmentItem {
  id: string;
  studentId: string;
  classId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  student: EnrolledStudent;
}

export interface EnrollResult {
  enrolled: string[];
  skipped: { studentId: string; reason: string }[];
}

export interface UnenrollResult {
  classId: string;
  studentId: string;
}
