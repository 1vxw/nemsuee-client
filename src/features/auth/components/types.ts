export type ActivationStatus = {
  found: boolean;
  email: string;
  fullName?: string;
  role?: "STUDENT" | "INSTRUCTOR";
  createdAt?: string;
  activationSummary: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  verification?: {
    state: "VERIFIED" | "PENDING" | "EXPIRED" | "NOT_SENT";
    lastSentAt?: string | null;
    expiresAt?: string | null;
  };
  student?: {
    studentId?: string | null;
    enrollmentReadiness?: "READY" | "PENDING_EMAIL_VERIFICATION";
  } | null;
  instructor?: {
    approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
    note?: string | null;
    appliedAt?: string | null;
    reviewedAt?: string | null;
    portalReadiness?: "READY" | "PENDING";
  } | null;
  nextSteps: string[];
};
