import { useState } from "react";
import type { User } from "../../types/lms";

export function AuthScreen({
  api,
  onAuth,
  setMessage,
}: {
  api: any;
  onAuth: (token: string, user: User) => void;
  setMessage: (m: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const payload = Object.fromEntries(
            new FormData(e.currentTarget).entries(),
          );
          try {
            if (mode === "register") {
              await api("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              setMode("login");
            } else {
              const r = await api("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              onAuth(r.token, r.user);
            }
          } catch (err) {
            setMessage((err as Error).message);
          }
        }}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold">NEMSU E-Learning</h1>
        <p className="mb-4 text-sm text-slate-500">
          Professional learning environment
        </p>
        {mode === "register" && (
          <input
            name="fullName"
            required
            placeholder="Full name"
            className="mb-2 w-full rounded border border-slate-300 p-2"
          />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="mb-2 w-full rounded border border-slate-300 p-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="mb-2 w-full rounded border border-slate-300 p-2"
        />
        {mode === "register" && (
          <select
            name="role"
            className="mb-2 w-full rounded border border-slate-300 p-2"
          >
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
          </select>
        )}
        <button className="w-full rounded bg-blue-700 py-2 text-white">
          {mode === "login" ? "Login" : "Register"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-2 w-full text-sm text-blue-700"
        >
          {mode === "login" ? "Create account" : "Back"}
        </button>
      </form>
    </main>
  );
}
