import type { User } from "../../shared/types/lms";

export function Profile({ user }: { user: User }) {
  return (
    <article className="rounded-md border border-slate-200 p-4 text-sm">
      <p>Name: {user.fullName}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </article>
  );
}

