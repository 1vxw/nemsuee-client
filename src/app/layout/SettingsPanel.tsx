import type { User } from "../../shared/types/lms";

export type UserPreferences = {
  notificationsEnabled: boolean;
  emailDigestEnabled: boolean;
  compactTables: boolean;
  showQuickTips: boolean;
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex flex-col gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-3 transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-label text-sm font-medium text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant font-body leading-snug sm:mt-0">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors sm:h-6 sm:w-11 ${
          checked ? "bg-primary" : "bg-surface-container-high"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-surface-container-lowest shadow-sm transition-transform sm:h-5 sm:w-5 ${
            checked ? "translate-x-5 sm:translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsPanel({
  user,
  preferences,
  onChange,
}: {
  user: User;
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
}) {
  return (
    <section className="space-y-4">
      <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm md:p-5">
        <h3 className="font-headline text-lg font-bold text-primary">Settings</h3>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Personalize your LMS experience, {user.fullName.split(" ")[0]}.
        </p>
      </article>

      <article className="space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container p-4 md:p-5">
        <Toggle
          label="Enable Notifications"
          description="Show in-app notifications and updates in the header."
          checked={preferences.notificationsEnabled}
          onChange={(value) =>
            onChange({ ...preferences, notificationsEnabled: value })
          }
        />
        <Toggle
          label="Email Digest"
          description="Receive summary emails for major academic activity."
          checked={preferences.emailDigestEnabled}
          onChange={(value) =>
            onChange({ ...preferences, emailDigestEnabled: value })
          }
        />
        <Toggle
          label="Compact Tables"
          description="Reduce table row spacing in data-heavy pages."
          checked={preferences.compactTables}
          onChange={(value) => onChange({ ...preferences, compactTables: value })}
        />
        <Toggle
          label="Show Quick Tips"
          description="Display onboarding helper tips in dashboard modules."
          checked={preferences.showQuickTips}
          onChange={(value) => onChange({ ...preferences, showQuickTips: value })}
        />
      </article>
    </section>
  );
}
