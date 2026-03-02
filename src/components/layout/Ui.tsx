import type { Role, User, ViewKey } from "../../types/lms";

export function menu(role: Role): { key: ViewKey; label: string }[] {
  return [
    { key: "dashboard", label: "Dashboard" },
    {
      key: "courses",
      label: role === "INSTRUCTOR" ? "Courses" : "Course Search",
    },
    {
      key: "scores",
      label: role === "INSTRUCTOR" ? "Student Scores" : "My Scores",
    },
    { key: "storage", label: "My Storage" },
    { key: "profile", label: "Profile" },
  ];
}

export function Sidebar({
  user,
  view,
  setView,
  onLogout,
}: {
  user: User;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-md bg-gradient-to-br from-blue-700 to-blue-900 p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-slate-200">
          NEMSU
        </p>
        <h1 className="text-lg font-bold">E-Learning Platform</h1>
      </div>
      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm">
        <span className="font-semibold">{user.fullName}</span>
        <br />
        {user.role}
      </p>
      <nav className="mt-3 space-y-2">
        {menu(user.role).map((m) => (
          <button
            key={m.key}
            onClick={() => setView(m.key)}
            className={`w-full rounded px-3 py-2 text-left text-sm ${view === m.key ? "bg-blue-700 text-white" : "bg-white hover:bg-slate-100"}`}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <button
        className="mt-6 w-full rounded bg-slate-900 px-3 py-2 text-sm text-white"
        onClick={onLogout}
      >
        Logout
      </button>
    </aside>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md bg-gradient-to-r from-blue-700 to-blue-900 p-3 text-white">
      <p className="text-xs uppercase tracking-wide text-slate-200">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </article>
  );
}

export function DashboardInfo({
  role,
  onNavigate,
  onRefresh,
}: {
  role: Role;
  onNavigate: (view: ViewKey) => void;
  onRefresh: () => void;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="mb-3">
        Use Courses to open a course workspace, manage section-based content,
        and handle enrollment requests.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <button
          onClick={() => onNavigate("courses")}
          className="rounded bg-blue-700 px-3 py-2 text-white"
        >
          {role === "INSTRUCTOR" ? "Open Courses" : "Search Courses"}
        </button>
        <button
          onClick={() => onNavigate("scores")}
          className="rounded border border-slate-300 bg-white px-3 py-2"
        >
          {role === "INSTRUCTOR" ? "Student Scores" : "My Scores"}
        </button>
        <button
          onClick={() => onNavigate("storage")}
          className="rounded border border-slate-300 bg-white px-3 py-2"
        >
          My Storage
        </button>
        <button
          onClick={() => onNavigate("profile")}
          className="rounded border border-slate-300 bg-white px-3 py-2"
        >
          Profile
        </button>
        <button
          onClick={onRefresh}
          className="rounded border border-slate-300 bg-white px-3 py-2"
        >
          Refresh Data
        </button>
      </div>
    </article>
  );
}

export function Profile({ user }: { user: User }) {
  return (
    <article className="rounded-md border border-slate-200 p-4 text-sm">
      <p>Name: {user.fullName}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </article>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      {text}
    </p>
  );
}
