type EnrollmentInfoModalProps = {
  open: boolean;
  onClose: () => void;
};

export function EnrollmentInfoModal({
  open,
  onClose,
}: EnrollmentInfoModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-headline text-lg font-bold text-primary">
              Enrollment Info
            </h3>
            <p className="text-sm text-on-surface-variant">
              Quick guide for newly created student and instructor accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <div className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-4">
            <p className="font-label text-sm font-bold text-on-surface">
              Students
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Register with your student ID, verify your email, then sign in and
              wait for course enrollment directions from your department.
            </p>
          </div>
          <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
            <p className="font-label text-sm font-bold text-on-surface">
              Instructors
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Complete registration, verify your email, and monitor admin
              approval in the activation center before attempting to access
              instructor tools.
            </p>
          </div>
          <div className="rounded-xl bg-surface p-4 text-sm text-on-surface">
            <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-2">
              Recommended
            </p>
            Use the Account Activation button to check your current status
            anytime and request a fresh verification email if the previous one
            expired.
          </div>
        </div>
      </div>
    </div>
  );
}
