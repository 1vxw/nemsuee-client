import type { User } from "../../shared/types/lms";

export function Profile({ user }: { user: User }) {
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="space-y-4">
      <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm md:p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-headline text-lg font-bold text-on-primary sm:h-14 sm:w-14 sm:text-xl">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-headline text-lg font-bold text-primary truncate">{user.fullName}</h3>
            <p className="mt-0.5 font-body text-sm text-on-surface-variant truncate">{user.email}</p>
          </div>
        </div>
      </article>

      <article className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">Role</p>
          <p className="mt-1 font-headline text-base font-bold text-primary">{user.role}</p>
        </div>
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">Account ID</p>
          <p className="mt-1 font-headline text-base font-bold text-primary">#{user.id}</p>
        </div>
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:col-span-2 md:col-span-1">
          <p className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">Student ID</p>
          <p className="mt-1 font-headline text-base font-bold text-primary">
            {user.studentId || "N/A"}
          </p>
        </div>
      </article>
    </section>
  );
}

