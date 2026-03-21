import type { ReactElement } from "react";
import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "../../../shared/types/lms";
import { AdminRegistrarDashboard } from "./AdminRegistrarDashboard";
import { DeanDashboard } from "./DeanDashboard";
import { InstructorDashboard } from "./InstructorDashboard";
import { RegistrarDashboard } from "./RegistrarDashboard";
import { StudentDashboard } from "./StudentDashboard";

type DashboardProps = {
  user: User;
  courses: Course[];
  archivedCourses: Course[];
  teachingBlocks: TeachingBlock[];
  attempts: Attempt[];
  lastSync: Date | null;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
  hideLmsSisFeatures: boolean;
  onOpenCourse?: (courseId: number) => void;
  api: (path: string, opts?: { headers?: Record<string, string> }) => Promise<unknown>;
  headers: Record<string, string>;
};

export function RoleDashboard(props: DashboardProps) {
  let dashboardContent: ReactElement;
  if (props.user.role === "ADMIN") {
    dashboardContent = <AdminRegistrarDashboard {...props} />;
  } else if (props.user.role === "REGISTRAR") {
    dashboardContent = <RegistrarDashboard {...props} />;
  } else if (props.user.role === "DEAN") {
    dashboardContent = <DeanDashboard {...props} />;
  } else if (props.user.role === "INSTRUCTOR") {
    dashboardContent = <InstructorDashboard {...props} />;
  } else {
    dashboardContent = <StudentDashboard {...props} />;
  }

  return <section className="space-y-4">{dashboardContent}</section>;
}



