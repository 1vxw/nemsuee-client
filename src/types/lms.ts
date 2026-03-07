export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type ViewKey =
  | "dashboard"
  | "courses"
  | "admin_blocks"
  | "archives"
  | "course_search"
  | "scores"
  | "storage"
  | "profile";
export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  studentId?: string | null;
};
export type Quiz = { id: number; questions: { id: number; prompt: string }[] };
export type Lesson = {
  id: number;
  title: string;
  content: string;
  fileUrl?: string | null;
  quiz?: Quiz | null;
};

export type Section = { id: number; name: string; lessons: Lesson[] };

export type Course = {
  id: number;
  title: string;
  description: string;
  isArchived?: boolean;
  enrollmentKey?: string;
  sections: Section[];
  instructor?: { fullName: string };
  instructors?: { id: number; fullName: string; email?: string }[];
};

export type Attempt = {
  id: number;
  score: number;
  total: number;
  quiz: { lesson: { title: string; course: { id: number; title: string } } };
  student?: { fullName: string };
};

export type CatalogCourse = {
  id: number;
  title: string;
  description: string;
  instructor: { fullName: string };
  instructors?: { id: number; fullName: string; email?: string }[];
  sections: { id: number; name: string }[];
  enrollmentStatus: EnrollmentStatus | null;
};

export type RosterRow = {
  id: number;
  student: { fullName: string; email: string };
  section?: { id: number; name: string } | null;
};

export type DriveFile = {
  id?: string | null;
  name?: string | null;
  webViewLink?: string | null;
  mimeType?: string | null;
};

export type TeachingBlock = {
  id: number;
  name: string;
  courseId: number;
  courseTitle: string;
  courseDescription: string;
};
