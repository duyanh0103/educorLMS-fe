export interface AdminDashboard {
  users: {
    total: number;
    byRole: { superAdmin: number; teacher: number; student: number };
    active: number;
    inactive: number;
  };
  courses: { total: number; active: number; inactive: number };
  classes: { total: number; active: number; inactive: number };
  enrollments: { total: number };
  exams: {
    total: number;
    draft: number;
    published: number;
    closed: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    submissionRate: number; // 0..1
  };
  assignments: {
    total: number;
    draft: number;
    published: number;
    closed: number;
    totalSubmissions: number;
    lateSubmissions: number;
    gradedSubmissions: number;
  };
}

export interface TeacherDashboardClassItem {
  id: string;
  name: string;
  courseName: string;
  studentCount: number;
}

export interface TeacherDashboard {
  classes: {
    total: number;
    active: number;
    inactive: number;
    list: TeacherDashboardClassItem[];
  };
  students: { totalUniqueStudents: number };
  exams: { total: number; draft: number; published: number; pendingGrading: number };
  assignments: { total: number; draft: number; published: number; pendingGrading: number };
}
