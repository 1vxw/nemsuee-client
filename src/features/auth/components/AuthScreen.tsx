import { useMemo, useState } from "react";
import type { User } from "../../../shared/types/lms";
import coverImage from "../../../assets/cover.png";
import logoImage from "../../../assets/logo.png";

export function AuthScreen({
  api,
  onAuth,
  message,
  setMessage,
  theme,
}: {
  api: any;
  onAuth: (user: User) => void;
  message: string;
  setMessage: (m: string) => void;
  theme: "light" | "dark";
}) {
  const isDark = theme === "dark";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [showCampusNotice, setShowCampusNotice] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );
  const passwordStrong =
    passwordChecks.length &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number &&
    passwordChecks.special;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    try {
      setIsSubmitting(true);
      if (mode === "register") {
        if (!passwordStrong) {
          setMessage("Password must meet all security requirements.");
          return;
        }
        if (password !== confirmPassword) {
          setMessage("Password confirmation does not match.");
          return;
        }
        await api("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            role,
            studentId: role === "STUDENT" ? studentId : undefined,
          }),
        });
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setMessage(
          role === "INSTRUCTOR"
            ? "Registration submitted. Your instructor account must be approved by admin before login."
            : "Registration successful. You can now log in.",
        );
        return;
      }

      const r = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      onAuth(r.user);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGuestAccess() {
    setMessage("");
    try {
      setGuestSubmitting(true);
      const r = await api("/auth/guest", { method: "POST" });
      onAuth(r.user);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setGuestSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface text-on-surface overflow-x-hidden">
      <nav
        className={`fixed top-0 w-full z-50 h-14 flex justify-between items-center px-4 md:px-8 transition-all duration-300 ease-in-out backdrop-blur-lg relative ${isDark ? "border-b border-white/10 bg-slate-950/40" : "border-b border-black/10 bg-white/40"}`}
      >
        <div className="flex items-center gap-2">
          <img
            src={logoImage}
            alt="NEMSUEE logo"
            className="h-9 w-9 rounded-sm object-contain"
          />
          <span 
            className={`text-l font-black tracking-tight font-headline ${isDark ? "text-white" : "text-primary"}`}
          >
            North Eastern Mindanao State University
          </span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a
            className={`font-label text-sm hover:opacity-75 transition-opacity ${isDark ? "text-white" : "text-on-surface-variant hover:text-primary"}`}
            href="#"
          >
            About NEMSU
          </a>
          <a
            className={`font-label text-sm hover:opacity-75 transition-opacity ${isDark ? "text-white" : "text-on-surface-variant hover:text-primary"}`}
            href="#"
          >
            Academic Programs
          </a>
          <a
            className={`font-label text-sm hover:opacity-75 transition-opacity ${isDark ? "text-white" : "text-on-surface-variant hover:text-primary"}`}
            href="#"
          >
            Support
          </a>
          <button
            type="button"
            onClick={onGuestAccess}
            disabled={guestSubmitting}
            className={`px-5 py-2 rounded-md font-label text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity ${isDark ? "bg-white text-slate-950" : "bg-primary text-on-primary"}`}
          >
            {guestSubmitting ? "Please wait..." : "Guest Access"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className={`md:hidden rounded-md p-2 transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-primary hover:bg-black/5"}`}
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              className="md:hidden fixed inset-0 top-14 z-40 bg-black/30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className={`md:hidden absolute left-0 right-0 top-14 z-50 border-b ${isDark ? "border-white/10 bg-slate-950/95" : "border-black/10 bg-white/95"} backdrop-blur-lg`}
            >
              <div className="px-4 py-4 space-y-2">
                <a
                  className={`block rounded-md px-3 py-2 font-label text-sm font-semibold transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-on-surface-variant hover:bg-black/5 hover:text-primary"}`}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About NEMSU
                </a>
                <a
                  className={`block rounded-md px-3 py-2 font-label text-sm font-semibold transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-on-surface-variant hover:bg-black/5 hover:text-primary"}`}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Academic Programs
                </a>
                <a
                  className={`block rounded-md px-3 py-2 font-label text-sm font-semibold transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-on-surface-variant hover:bg-black/5 hover:text-primary"}`}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Support
                </a>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void onGuestAccess();
                    }}
                    disabled={guestSubmitting}
                    className={`w-full px-5 py-2.5 rounded-md font-label text-sm font-bold tracking-wide hover:opacity-90 transition-opacity ${isDark ? "bg-white text-slate-950" : "bg-primary text-on-primary"} disabled:opacity-60`}
                  >
                    {guestSubmitting ? "Please wait..." : "Guest Access"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
      <main className="flex-1 flex flex-col md:flex-row pt-14">
        <section
          className="relative w-full md:w-1/2 lg:w-3/5 overflow-hidden flex items-start justify-center p-8 pt-16 md:p-20 md:pt-24"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(0, 29, 68, 0.99) 0%, rgba(0, 50, 107, 0.96) 50%, rgba(119, 90, 25, 0.8) 100%), url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 z-0"></div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-headline font-black text-white text-5xl lg:text-7xl leading-none mb-2">
              Enter the <br />
              <span className="text-secondary-fixed">Digital Athenaeum</span>
            </h1>
            <p className="text-primary-fixed-dim text-xl lg:text-2xl font-body leading-tight max-w-xl opacity-90">
              Welcome to North Eastern Mindanao State University E-Learning
              Experience. A space dedicated to academic excellence, research,
              and collaborative growth.
            </p>
            <div className="mt-8 flex gap-8 border-t border-white/10 pt-8">
              <div>
                <div className="text-white font-headline text-3xl font-bold">
                  12k+
                </div>
                <div className="text-primary-fixed-dim font-label text-xs uppercase tracking-widest mt-1">
                  Students
                </div>
              </div>
              <div>
                <div className="text-white font-headline text-3xl font-bold">
                  450+
                </div>
                <div className="text-primary-fixed-dim font-label text-xs uppercase tracking-widest mt-1">
                  Courses
                </div>
              </div>
              <div>
                <div className="text-white font-headline text-3xl font-bold">
                  98%
                </div>
                <div className="text-primary-fixed-dim font-label text-xs uppercase tracking-widest mt-1">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
          {showCampusNotice && (
            <div className="fixed top-24 left-4 right-4 md:bottom-8 md:top-auto md:left-8 md:right-auto z-50 flex items-start md:items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 px-4 py-3 max-w-xs md:max-w-none animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="material-symbols-outlined text-secondary-fixed text-2xl flex-shrink-0">
                notifications_active
              </span>
              <div className="flex-1">
                <p className="font-label text-xs uppercase tracking-widest text-white/80">
                  Campus Notice
                </p>
                <p className="font-body text-sm text-white font-semibold">
                  Semester finals scheduled for Dec 12.
                </p>
              </div>
              <button
                onClick={() => setShowCampusNotice(false)}
                className="flex-shrink-0 text-white/60 hover:text-white/80 transition-colors p-1"
                aria-label="Close campus notice"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        </section>
        <section className="w-full md:w-1/2 lg:w-2/5 bg-surface flex flex-col items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h2 className="font-headline text-3xl font-bold text-primary mb-2">
                Portal Access
              </h2>
              <p className="text-on-surface-variant font-body">
                Please provide your institutional credentials to enter your
                learning space.
              </p>
            </div>
            {message && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3">
                <span className="material-symbols-outlined text-error text-sm mt-0.5">
                  error
                </span>
                <div className="flex-1">
                  <p className="text-sm text-error font-medium">{message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  className="text-error hover:text-error/80 transition-colors"
                  aria-label="Dismiss error"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            )}
            <div className="flex gap-2 mb-6 bg-surface-container-low rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded font-label font-semibold text-sm transition-all ${mode === "login" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 rounded font-label font-semibold text-sm transition-all ${mode === "register" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
              >
                Register
              </button>
            </div>
            <form
              onSubmit={onSubmit}
              className="space-y-4 pt-4 border-t-2 border-secondary"
            >
              {mode === "register" && (
                <div className="relative">
                  <label className="block font-label text-sm font-medium text-on-surface-variant mb-1 ml-1">
                    Full Name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    name="fullName"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all placeholder:text-outline-variant text-primary font-body"
                  />
                </div>
              )}
              <div className="relative">
                <label className="block font-label text-sm font-medium text-on-surface-variant mb-1 ml-1">
                  Username or Institutional Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. s.doe@nemsu.edu.ph"
                  className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all placeholder:text-outline-variant text-primary font-body"
                />
                <div className="absolute right-2 top-9 text-outline-variant">
                  <span className="material-symbols-outlined text-lg">
                    alternate_email
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="flex justify-between items-end mb-1">
                  <label className="block font-label text-sm font-medium text-on-surface-variant ml-1">
                    Password
                  </label>
                  {mode === "login" && (
                    <a className="font-label text-xs font-semibold text-secondary hover:text-primary transition-colors">
                      Forgot Password?
                    </a>
                  )}
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all placeholder:text-outline-variant text-primary font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-11 text-outline-variant hover:text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {mode === "register" && (
                <>
                  <div className="relative">
                    <label className="block font-label text-sm font-medium text-on-surface-variant mb-1 ml-1">
                      Confirm Password
                    </label>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all placeholder:text-outline-variant text-primary font-body"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2 top-9 text-outline-variant hover:text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <div className="relative">
                    <label className="block font-label text-sm font-medium text-on-surface-variant mb-1 ml-1">
                      Account Type
                    </label>
                    <select
                      value={role}
                      onChange={(e) => {
                        const nextRole = e.target.value as
                          | "STUDENT"
                          | "INSTRUCTOR";
                        setRole(nextRole);
                        if (nextRole !== "STUDENT") setStudentId("");
                      }}
                      className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all font-body text-on-surface appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22none%22 stroke=%22%23c3c6d1%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M6 8l4 4 4-4%22/></svg>')`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.5rem center",
                        backgroundSize: "1rem 1rem",
                        paddingRight: "2.2rem",
                      }}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="INSTRUCTOR">
                        Instructor (Admin approval required)
                      </option>
                    </select>
                  </div>
                  {role === "STUDENT" && (
                    <div className="relative">
                      <label className="block font-label text-sm font-medium text-on-surface-variant mb-1 ml-1">
                        Student ID
                      </label>
                      <input
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                        placeholder="e.g. 2024-12345"
                        className="w-full bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary px-1 py-3 transition-all placeholder:text-outline-variant text-primary font-body"
                      />
                    </div>
                  )}
                  <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
                    <p className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                      Password Requirements
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-label">
                      <div
                        className={`flex items-center gap-2 ${passwordChecks.length ? "text-tertiary" : "text-on-surface-variant"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {passwordChecks.length
                            ? "task_alt"
                            : "radio_button_unchecked"}
                        </span>
                        8+ characters
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordChecks.upper ? "text-tertiary" : "text-on-surface-variant"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {passwordChecks.upper
                            ? "task_alt"
                            : "radio_button_unchecked"}
                        </span>
                        Uppercase
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordChecks.lower ? "text-tertiary" : "text-on-surface-variant"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {passwordChecks.lower
                            ? "task_alt"
                            : "radio_button_unchecked"}
                        </span>
                        Lowercase
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordChecks.number ? "text-tertiary" : "text-on-surface-variant"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {passwordChecks.number
                            ? "task_alt"
                            : "radio_button_unchecked"}
                        </span>
                        Number
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordChecks.special ? "text-tertiary" : "text-on-surface-variant"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {passwordChecks.special
                            ? "task_alt"
                            : "radio_button_unchecked"}
                        </span>
                        Special char
                      </div>
                      <div
                        className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? "text-tertiary" : "text-on-surface-variant"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {password === confirmPassword && password.length > 0
                            ? "task_alt"
                            : "radio_button_unchecked"}
                        </span>
                        Match
                      </div>
                    </div>
                  </div>
                </>
              )}
              {mode === "login" && (
                <div className="flex items-center gap-3 ml-1">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <label
                    className="font-label text-sm text-on-surface-variant"
                    htmlFor="remember"
                  >
                    Keep me signed in on this device
                  </label>
                </div>
              )}
              <div className="pt-4">
                <button
                  disabled={
                    isSubmitting || (mode === "register" && !passwordStrong)
                  }
                  type="submit"
                  className="w-full py-4 bg-primary text-on-primary rounded-md font-label font-bold text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">
                        sync
                      </span>
                      Please wait...
                    </>
                  ) : mode === "login" ? (
                    <>
                      SIGN IN TO PORTAL
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </>
                  ) : (
                    <span className="uppercase">Create Account</span>
                  )}
                </button>
              </div>
            </form>
            {mode === "login" && (
              <div className="mt-5 pt-4 border-t border-surface-container text-center">
                <button
                  type="button"
                  onClick={() => setShowTestAccounts(true)}
                  className="font-label text-[11px] leading-none font-semibold text-secondary hover:text-primary transition-colors px-2 py-1"
                >
                  View Test Accounts
                </button>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-surface-container">
              <p className="font-label text-sm font-semibold text-on-surface-variant mb-4 text-center">
                Are you a new student or faculty member?
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <a
                  href="#"
                  className="px-6 py-2 border border-outline-variant text-primary font-label text-xs font-extrabold tracking-tight rounded hover:bg-surface-container transition-colors"
                >
                  ACCOUNT ACTIVATION
                </a>
                <a
                  href="#"
                  className="px-6 py-2 bg-secondary-container text-on-secondary-container font-label text-xs font-extrabold tracking-tight rounded hover:opacity-90 transition-opacity"
                >
                  ENROLLMENT INFO
                </a>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                © {new Date().getFullYear()} North Eastern Mindanao State
                University. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </main>
      {showTestAccounts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-primary">
                Test Accounts
              </h3>
              <button
                type="button"
                onClick={() => setShowTestAccounts(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 text-sm font-body">
              <div className="bg-surface-container p-3 rounded-lg">
                <p className="font-semibold text-primary mb-1">Instructor</p>
                <p className="font-label text-xs text-on-surface-variant">
                  23-1-00761@vsu.edu.ph
                </p>
              </div>
              <div className="bg-surface-container p-3 rounded-lg">
                <p className="font-semibold text-primary mb-1">Student</p>
                <p className="font-label text-xs text-on-surface-variant">
                  jipre@nemsu.edu
                </p>
              </div>
              <div className="bg-tertiary-fixed/30 p-3 rounded-lg">
                <p className="font-label text-xs text-on-tertiary-container">
                  Password for all accounts:{" "}
                  <span className="font-semibold">vince691 or Kuyaloy1.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
