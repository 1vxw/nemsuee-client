type InstructorApplication = {
  id: number;
  userId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  note?: string | null;
  fullName: string;
  email: string;
  createdAt: string;
};

export function InstructorApplicationsPanel(props: {
  applications: InstructorApplication[];
  loadApplications: () => Promise<void>;
  setMessage: (m: string) => void;
  api: any;
  headers: any;
}) {
  const { applications, loadApplications, setMessage, api, headers } = props;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Instructor Registration Review</h3>
          <p className="text-xs text-slate-500">Approve or reject instructor accounts before they can log in.</p>
        </div>
        <button onClick={() => loadApplications()} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
          Refresh
        </button>
      </div>
      <div className="space-y-2">
        {applications.map((app) => (
          <article key={app.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{app.fullName}</p>
                <p className="text-xs text-slate-500">{app.email}</p>
                <p className="mt-1 text-xs">
                  <span className={`rounded px-2 py-0.5 ${
                    app.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-700"
                      : app.status === "REJECTED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                  }`}>
                    {app.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api(`/auth/instructor-applications/${app.userId}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ status: "APPROVED" }),
                      });
                      await loadApplications();
                      setMessage("Instructor approved.");
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                  className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white"
                >
                  Approve
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api(`/auth/instructor-applications/${app.userId}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ status: "REJECTED" }),
                      });
                      await loadApplications();
                      setMessage("Instructor rejected.");
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}
        {!applications.length && <p className="text-sm text-slate-500">No instructor applications.</p>}
      </div>
    </article>
  );
}
