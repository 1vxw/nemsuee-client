import { formatDateTime } from "../../../shared/utils/formatDate";
import type { ActivationStatus } from "./types";

type AccountActivationPanelProps = {
  email: string;
  signInEmail: string;
  status: ActivationStatus | null;
  loading: boolean;
  resendLoading: boolean;
  onEmailChange: (value: string) => void;
  onUseSignInEmail: () => void;
  onClear: () => void;
  onCheckStatus: () => void;
  onResend: () => void;
};

function getVerificationTone(status: ActivationStatus | null) {
  switch (status?.verification?.state) {
    case "VERIFIED":
      return {
        chip: "bg-tertiary/15 text-tertiary",
        icon: "verified",
        label: "Verified",
      };
    case "PENDING":
      return {
        chip: "bg-secondary/15 text-secondary",
        icon: "mark_email_unread",
        label: "Waiting for email verification",
      };
    case "EXPIRED":
      return {
        chip: "bg-error/10 text-error",
        icon: "schedule",
        label: "Verification link expired",
      };
    default:
      return {
        chip: "bg-surface-container text-on-surface-variant",
        icon: "draft",
        label: "Verification email not yet sent",
      };
  }
}

export function AccountActivationPanel({
  email,
  signInEmail,
  status,
  loading,
  resendLoading,
  onEmailChange,
  onUseSignInEmail,
  onClear,
  onCheckStatus,
  onResend,
}: AccountActivationPanelProps) {
  const verificationTone = getVerificationTone(status);

  return (
    <div className="space-y-4 pt-4 border-t-2 border-secondary">
      <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary">
            outgoing_mail
          </span>
          <div>
            <p className="font-label text-sm font-semibold text-on-surface">
              Activation lookup
            </p>
            <p className="text-sm text-on-surface-variant">
              Enter the same email used during registration to view verification
              and approval progress.
            </p>
          </div>
        </div>
        <div className="relative">
          <label className="block font-label text-sm font-medium text-on-surface-variant mb-1 ml-1">
            Registered Email Address
          </label>
          <input
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            name="activation-email"
            type="email"
            placeholder="Enter the email used to register"
            className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all placeholder:text-outline-variant text-primary font-body"
          />
          <div className="absolute right-2 top-9 text-outline-variant">
            <span className="material-symbols-outlined text-lg">
              alternate_email
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {signInEmail.trim() && (
            <button
              type="button"
              onClick={onUseSignInEmail}
              className="rounded-full border border-outline-variant/30 px-3 py-1 font-label text-[11px] font-semibold text-secondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              Use sign-in email
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-outline-variant/30 px-3 py-1 font-label text-[11px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Clear lookup
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <button
          disabled={loading}
          type="button"
          onClick={onCheckStatus}
          className="w-full py-4 bg-primary text-on-primary rounded-md font-label font-bold text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">
                sync
              </span>
              Please wait...
            </>
          ) : (
            <span className="uppercase">Check Account Status</span>
          )}
        </button>

        <button
          type="button"
          disabled={!email.trim() || resendLoading}
          onClick={onResend}
          className="w-full py-3 border border-outline-variant/30 rounded-md font-label font-bold text-xs tracking-widest text-secondary hover:text-primary hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {resendLoading
            ? "Sending verification email..."
            : "Resend Verification Email"}
        </button>
      </div>

      {status && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-headline text-lg font-bold text-primary">
                  {status.found ? status.fullName || status.email : "Account not found"}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {status.activationSummary}
                </p>
              </div>
              {status.found && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${verificationTone.chip}`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {verificationTone.icon}
                  </span>
                  {verificationTone.label}
                </span>
              )}
            </div>

            {status.found && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                      Account Type
                    </p>
                    <p className="mt-1 font-semibold text-on-surface">
                      {status.role === "INSTRUCTOR" ? "Instructor" : "Student"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                      Registered On
                    </p>
                    <p className="mt-1 font-semibold text-on-surface">
                      {status.createdAt
                        ? formatDateTime(status.createdAt)
                        : "Unavailable"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                      Last Verification Email
                    </p>
                    <p className="mt-1 font-semibold text-on-surface">
                      {status.verification?.lastSentAt
                        ? formatDateTime(status.verification.lastSentAt)
                        : "No email recorded yet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                      Email Verified At
                    </p>
                    <p className="mt-1 font-semibold text-on-surface">
                      {status.emailVerifiedAt
                        ? formatDateTime(status.emailVerifiedAt)
                        : "Not yet verified"}
                    </p>
                  </div>
                </div>

                {status.role === "STUDENT" && (
                  <div className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-tertiary">
                        school
                      </span>
                      <p className="font-label text-sm font-bold text-on-surface">
                        Student Activation Details
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                          Student ID
                        </p>
                        <p className="mt-1 font-semibold text-on-surface">
                          {status.student?.studentId || "Not available"}
                        </p>
                      </div>
                      <div>
                        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                          Portal Readiness
                        </p>
                        <p className="mt-1 font-semibold text-on-surface">
                          {status.student?.enrollmentReadiness === "READY"
                            ? "Ready to sign in"
                            : "Waiting for email verification"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {status.role === "INSTRUCTOR" && (
                  <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">
                        badge
                      </span>
                      <p className="font-label text-sm font-bold text-on-surface">
                        Instructor Approval Details
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                          Approval Status
                        </p>
                        <p className="mt-1 font-semibold text-on-surface">
                          {status.instructor?.approvalStatus || "Pending"}
                        </p>
                      </div>
                      <div>
                        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                          Reviewed At
                        </p>
                        <p className="mt-1 font-semibold text-on-surface">
                          {status.instructor?.reviewedAt
                            ? formatDateTime(status.instructor.reviewedAt)
                            : "Awaiting review"}
                        </p>
                      </div>
                    </div>
                    {status.instructor?.note && (
                      <div className="rounded-lg bg-surface px-3 py-3 text-sm text-on-surface">
                        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-1">
                          Reviewer Note
                        </p>
                        {status.instructor.note}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-outline-variant/20 bg-surface p-4">
                  <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-3">
                    Recommended Next Steps
                  </p>
                  <div className="space-y-2">
                    {status.nextSteps.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="flex items-start gap-2 text-sm text-on-surface"
                      >
                        <span className="material-symbols-outlined text-secondary text-base mt-0.5">
                          task_alt
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
