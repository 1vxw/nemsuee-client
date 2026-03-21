import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "./shared/hooks/useApi";
import { useActionIconizer } from "./shared/hooks/useActionIconizer";
import { useNotifications } from "./shared/hooks/useNotifications";
import type {
  Attempt,
  Course,
  TeachingBlock,
  User,
  ViewKey,
} from "./shared/types/lms";
import logo from "./assets/logo.png";
import { AdminBlocksHub } from "./features/admin/components/AdminBlocksHub";
import { AuthScreen } from "./features/auth/components/AuthScreen";
import { CourseCatalogPage } from "./features/courses/pages/CourseCatalogPage";
import { CoursesHub } from "./features/courses/pages/CoursesHub";
import { Profile, SettingsPanel, Sidebar } from "./app/layout/Ui";
import type { UserPreferences } from "./app/layout/Ui";
import { ScoresHub } from "./features/scores/pages/ScoresHub";
import { Storage } from "./features/storage/components/Storage";
import { GradeComputationHub } from "./features/grade-computation/pages/GradeComputationHub";
import { RoleDashboard } from "./features/dashboard/pages/RoleDashboard";

export default function App() {
  const defaultPreferences: UserPreferences = {
    notificationsEnabled: true,
    emailDigestEnabled: false,
    compactTables: false,
    showQuickTips: true,
  };
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light",
  );
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [view, setView] = useState<ViewKey>("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachingBlocks, setTeachingBlocks] = useState<TeachingBlock[]>([]);
  const [archivedCourses, setArchivedCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const raw = localStorage.getItem("user_preferences");
      if (!raw) return defaultPreferences;
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      return {
        notificationsEnabled:
          parsed.notificationsEnabled ??
          defaultPreferences.notificationsEnabled,
        emailDigestEnabled:
          parsed.emailDigestEnabled ?? defaultPreferences.emailDigestEnabled,
        compactTables: parsed.compactTables ?? defaultPreferences.compactTables,
        showQuickTips: parsed.showQuickTips ?? defaultPreferences.showQuickTips,
      };
    } catch {
      return defaultPreferences;
    }
  });
  const [currentTermLabel, setCurrentTermLabel] = useState("Term: --");
  const [hideLmsSisFeatures, setHideLmsSisFeatures] = useState(false);
  const [forcedCourseTab, setForcedCourseTab] = useState<
    "content" | "quizzes" | "assignments" | "activities" | null
  >(null);
  const { api, headers } = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedCourseIdRef = useRef<number | null>(selectedCourseId);
  const {
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications({
    api,
    headers,
    enabled: Boolean(user) && preferences.notificationsEnabled,
  });
  const gradesHiddenForUi = hideLmsSisFeatures;

  useActionIconizer();

  useEffect(() => {
    const appTheme = user ? "light" : theme;
    document.documentElement.setAttribute("data-theme", appTheme);
    localStorage.setItem("theme", theme);
  }, [theme, user]);

  useEffect(() => {
    localStorage.setItem("user_preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    selectedCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId]);

  function navigateToView(nextView: ViewKey) {
    if (
      gradesHiddenForUi &&
      (nextView === "scores" || nextView === "grade_computation")
    ) {
      setView("dashboard");
      navigate("/dashboard");
      return;
    }
    if (nextView === "course_search") {
      setView("course_catalog");
      navigate("/catalog");
      return;
    }
    setView(nextView);
    if (nextView !== "courses") setForcedCourseTab(null);
    if (nextView === "dashboard") navigate("/dashboard");
    if (nextView === "courses") navigate("/courses");
    if (nextView === "course_catalog") navigate("/catalog");
    if (nextView === "scores") navigate("/scores");
    if (nextView === "grade_computation") navigate("/grade-computation");
    if (nextView === "admin_blocks") navigate("/admin/blocks");
    if (nextView === "archives") navigate("/archives");
    if (nextView === "storage") navigate("/files");
    if (nextView === "settings") navigate("/settings");
  }

  function openCourse(courseId: number) {
    setView("courses");
    setSelectedCourseId(courseId);
    setForcedCourseTab(null);
    navigate(`/courses/${courseId}`);
  }

  async function refreshCore() {
    if (!user) return;
    try {
      const [c, a, archived, publicSettingsPayload] = await Promise.all([
        api("/courses", { headers }),
        user.role === "INSTRUCTOR"
          ? api("/quizzes/scores/instructor", { headers })
          : user.role === "STUDENT"
            ? api("/quizzes/scores/me", { headers })
            : Promise.resolve([]),
        user.role === "INSTRUCTOR"
          ? api("/courses/archived", { headers })
          : Promise.resolve([]),
        api("/admin/settings/public", { headers }).catch(() => ({
          settings: { hide_lms_sis_features: false },
        })),
      ]);
      setHideLmsSisFeatures(
        Boolean(publicSettingsPayload?.settings?.hide_lms_sis_features),
      );
      try {
        const activeTerm = await api("/terms/active", { headers });
        if (activeTerm?.academicYear && activeTerm?.name) {
          setCurrentTermLabel(
            `${activeTerm.academicYear} - ${activeTerm.name}`,
          );
        } else {
          setCurrentTermLabel("Term: --");
        }
      } catch {
        setCurrentTermLabel("Term: --");
      }
      const blocks =
        user.role === "INSTRUCTOR"
          ? await api("/courses/teaching-blocks", { headers })
          : [];
      const activeCourseIds = new Set(
        (c as Course[]).map((course) => course.id),
      );
      const visibleBlocks = (blocks as TeachingBlock[]).filter((block) =>
        activeCourseIds.has(block.courseId),
      );
      setCourses(c);
      setAttempts(a);
      setArchivedCourses(archived);
      setTeachingBlocks(visibleBlocks);
      const currentSelected = selectedCourseIdRef.current;
      if (!currentSelected && c[0]) {
        setSelectedCourseId(c[0].id);
      } else if (
        currentSelected &&
        !c.some((course: Course) => course.id === currentSelected)
      ) {
        setSelectedCourseId(c[0]?.id ?? null);
        if (location.pathname.startsWith("/courses/")) {
          navigate(c[0] ? `/courses/${c[0].id}` : "/courses");
        }
      }
      setLastSync(new Date());
      await loadNotifications();
    } catch (err) {
      // Handle error silently or log if needed
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/auth/me", { headers });
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } catch (e) {
        const status = (e as { status?: number })?.status;
        if (status === 401) {
          localStorage.removeItem("user");
          setUser(null);
          return;
        }
        setMessage((e as Error).message);
        if (!user) return;
      }
      await refreshCore().catch((e) => setMessage((e as Error).message));
    })();
  }, [user?.role]);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/") {
      setView("dashboard");
      return;
    }
    if (path === "/files") {
      setView("storage");
      return;
    }
    if (path === "/settings") {
      setView("settings");
      return;
    }
    if (path === "/admin/blocks") {
      setView("admin_blocks");
      return;
    }
    if (path === "/archives") {
      setView("archives");
      return;
    }
    if (path === "/catalog") {
      setView("course_catalog");
      return;
    }
    if (path === "/courses") {
      setView("courses");
      return;
    }
    if (path === "/scores") {
      if (gradesHiddenForUi) {
        setView("dashboard");
        navigate("/dashboard");
        return;
      }
      setView("scores");
      return;
    }
    if (path === "/grade-computation") {
      if (gradesHiddenForUi) {
        setView("dashboard");
        navigate("/dashboard");
        return;
      }
      setView("grade_computation");
      return;
    }
    const courseMatch = path.match(/^\/courses\/(\d+)$/);
    if (courseMatch) {
      setView("courses");
      setSelectedCourseId(Number(courseMatch[1]));
    }
  }, [location.pathname, gradesHiddenForUi, navigate]);

  if (!user) {
    return (
      <AuthScreen
        api={api}
        message={message}
        setMessage={setMessage}
        theme={theme}
        onToggleTheme={() =>
          setTheme((t) => (t === "light" ? "dark" : "light"))
        }
        onAuth={(u) => {
          localStorage.setItem("user", JSON.stringify(u));
          setUser(u);
        }}
      />
    );
  }

  const selectedCourse = courses.find((x) => x.id === selectedCourseId) || null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="fixed top-0 z-40 flex h-14 w-full justify-center border-b border-outline-variant/20 bg-surface-container-lowest/95 px-3 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex max-w-[92rem] w-full items-center justify-between px-2 py-2 md:px-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-lg p-2 text-on-surface transition-colors hover:bg-surface-container"
              aria-label="Toggle sidebar"
            >
              <span className="material-symbols-outlined text-[1.25rem] sm:text-[1.375rem]">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="University logo"
                className="h-6 w-6 rounded-sm object-contain sm:h-7 sm:w-7"
              />
              <p className="font-headline text-sm font-bold text-primary sm:text-base">
                NEMSUEE
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-1.5 sm:gap-2">
            <span className="hidden rounded-lg border border-outline-variant/30 bg-surface-container px-2 py-1 text-[11px] font-label text-on-surface-variant md:inline-block">
              {currentTermLabel}
            </span>
            {preferences.notificationsEnabled && (
              <>
                <button
                  className="relative rounded-lg p-2 text-on-surface transition-colors hover:bg-surface-container"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotificationsOpen((v) => !v);
                    loadNotifications();
                  }}
                >
                  <span className="material-symbols-outlined text-[1.25rem] sm:text-[1.375rem]">notifications</span>
                  {!!notifications.filter((n) => !Boolean(n.isRead)).length && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-lg sm:right-12">
                    <div className="mb-1 flex items-center justify-between px-2">
                      <p className="text-xs font-semibold text-on-surface-variant font-label">
                        Notifications
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-[11px] font-medium text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-on-surface-variant font-label"
                          disabled={
                            !notifications.some((n) => !Boolean(n.isRead))
                          }
                        >
                          Mark all as read
                        </button>
                        <button
                          onClick={() => clearNotifications()}
                          className="text-[11px] font-medium text-on-surface-variant hover:text-on-surface font-label disabled:cursor-not-allowed disabled:text-outline"
                          disabled={!notifications.length}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 space-y-1 overflow-auto">
                      {notifications.length ? (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            data-keep-action-text="true"
                            onClick={async () => {
                              if (!Boolean(notification.isRead)) {
                                await markAsRead(notification.id);
                              }
                              if (notification.courseId) {
                                setView("courses");
                                setSelectedCourseId(
                                  Number(notification.courseId),
                                );
                                setForcedCourseTab("content");
                                navigate(`/courses/${notification.courseId}`);
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`w-full rounded px-2 py-2 text-left hover:bg-surface-container transition-colors ${
                              Boolean(notification.isRead)
                                ? "bg-surface"
                                : "bg-primary-fixed/40"
                            }`}
                          >
                            <p className="line-clamp-2 text-xs text-on-surface font-body">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[11px] text-on-surface-variant font-label">
                              {notification.createdAt
                                ? new Date(
                                    notification.createdAt,
                                  ).toLocaleString()
                                : ""}
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="px-2 py-3 text-xs text-on-surface-variant font-label">
                          No notifications yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <button
              className="rounded-lg p-2 text-on-surface transition-colors hover:bg-surface-container"
              aria-label="Open profile menu"
              onClick={() => setProfileMenuOpen((v) => !v)}
            >
              <span className="material-symbols-outlined text-[1.25rem] sm:text-[1.375rem]">account_circle</span>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-44 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-1 shadow-lg">
                <button
                  onClick={() => {
                    setView("profile");
                    setProfileMenuOpen(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-label text-on-surface transition-colors hover:bg-surface-container"
                >
                  Profile
                </button>
                {!gradesHiddenForUi && (
                  <button
                    onClick={() => {
                      navigateToView("scores");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-label text-on-surface transition-colors hover:bg-surface-container"
                  >
                    Grades
                  </button>
                )}
                <button
                  onClick={() => {
                    api("/auth/logout", { method: "POST", headers }).catch(
                      () => null,
                    );
                    localStorage.removeItem("user");
                    setUser(null);
                  }}
                  data-keep-action-text="true"
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-label text-error transition-colors hover:bg-error-container/30"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden">
          <div className="h-full w-[280px] p-3">
            <Sidebar
              user={user}
              view={view}
              courses={courses}
              archivedCourses={archivedCourses}
              hideLmsSisFeatures={hideLmsSisFeatures}
              selectedCourseId={selectedCourseId}
              onOpenCourse={(id) => {
                openCourse(id);
                setSidebarOpen(false);
              }}
              teachingBlocks={teachingBlocks}
              onOpenTeachingBlock={(courseId, sectionId) => {
                setView("courses");
                setSelectedCourseId(courseId);
                navigate(`/courses/${courseId}#section-${sectionId}`);
                setSidebarOpen(false);
              }}
              onOpenArchivedCourse={(id) => {
                setView("archives");
                setSelectedCourseId(id);
                setSidebarOpen(false);
              }}
              setView={(v) => {
                navigateToView(v);
                setSidebarOpen(false);
              }}
            />
          </div>
          <button
            className="absolute inset-0 -z-10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
        </div>
      )}

      <div
        className={`mx-auto grid min-h-screen w-full max-w-[92rem] grid-cols-1 gap-4 px-4 py-4 pt-16 md:gap-5 md:px-5 md:py-5 md:pt-20 lg:gap-4 lg:px-6 lg:py-4 lg:pt-16 ${
          sidebarOpen ? "lg:grid-cols-[250px_1fr]" : "lg:grid-cols-1"
        }`}
      >
        {sidebarOpen && (
          <div className="hidden lg:block">
            <Sidebar
              user={user}
              view={view}
              courses={courses}
              archivedCourses={archivedCourses}
              hideLmsSisFeatures={hideLmsSisFeatures}
              selectedCourseId={selectedCourseId}
              onOpenCourse={openCourse}
              teachingBlocks={teachingBlocks}
              onOpenTeachingBlock={(courseId, sectionId) => {
                setView("courses");
                setSelectedCourseId(courseId);
                navigate(`/courses/${courseId}#section-${sectionId}`);
              }}
              onOpenArchivedCourse={(id) => {
                setView("archives");
                setSelectedCourseId(id);
              }}
              setView={(v) => {
                navigateToView(v);
              }}
            />
          </div>
        )}

        <main className="min-w-0 overflow-x-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {message && (
            <p className="mb-3 rounded border border-slate-300 bg-slate-100 p-2 text-sm">
              {message}
            </p>
          )}

          {view === "dashboard" && (
            <RoleDashboard
              user={user}
              courses={courses}
              archivedCourses={archivedCourses}
              teachingBlocks={teachingBlocks}
              attempts={attempts}
              hideLmsSisFeatures={hideLmsSisFeatures}
              lastSync={lastSync}
              onNavigate={navigateToView}
              onRefresh={() =>
                refreshCore().catch((e) => setMessage((e as Error).message))
              }
              onOpenCourse={openCourse}
              api={api}
              headers={headers}
            />
          )}
          {view === "course_catalog" && (
            <CourseCatalogPage
              user={user}
              api={api}
              headers={headers}
              courses={courses}
              attempts={attempts}
              onOpenCourse={openCourse}
              refreshCore={refreshCore}
              setMessage={setMessage}
            />
          )}
          {view === "courses" && selectedCourse && (
            <CoursesHub
              user={user}
              api={api}
              headers={headers}
              courses={courses}
              attempts={attempts}
              selectedCourse={selectedCourse}
              refreshCore={refreshCore}
              setMessage={setMessage}
              studentViewMode={user.role === "STUDENT" ? "my" : "all"}
              forcedCourseTab={forcedCourseTab}
            />
          )}
          {view === "courses" && !selectedCourse && (
            <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant/30 block mb-4">
                menu_book
              </span>
              <h3 className="font-headline text-lg font-bold text-primary mb-2">
                Select a Course
              </h3>
              <p className="text-on-surface-variant font-body text-sm max-w-sm mx-auto mb-4">
                Choose a course from the sidebar or browse the catalog to get
                started.
              </p>
              <button
                onClick={() => navigateToView("course_catalog")}
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Browse Course Catalog
              </button>
            </section>
          )}
          {view === "scores" && !gradesHiddenForUi && (
            <ScoresHub
              user={user}
              courses={courses}
              attempts={attempts}
              api={api}
              headers={headers}
              setMessage={setMessage}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
            />
          )}
          {view === "grade_computation" && !gradesHiddenForUi && (
            <GradeComputationHub
              user={user}
              courses={courses}
              api={api}
              headers={headers}
              setMessage={setMessage}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
            />
          )}
          {view === "storage" && (
            <Storage
              api={api}
              headers={headers}
              setMessage={setMessage}
              userRole={user.role}
            />
          )}
          {view === "profile" && <Profile user={user} />}
          {view === "settings" && (
            <SettingsPanel
              user={user}
              preferences={preferences}
              onChange={setPreferences}
            />
          )}
          {view === "admin_blocks" &&
            (user.role === "ADMIN" || user.role === "REGISTRAR") && (
              <AdminBlocksHub
                api={api}
                headers={headers}
                courses={courses}
                refreshCore={refreshCore}
                setMessage={setMessage}
              />
            )}
          {view === "archives" && user.role === "INSTRUCTOR" && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Archived Courses</h3>
              {archivedCourses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm text-slate-600">{course.description}</p>
                  <div className="mt-2">
                    <button
                      onClick={async () => {
                        try {
                          await api(`/courses/${course.id}/archive`, {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ archived: false }),
                          });
                          await refreshCore();
                          setMessage("Course unarchived.");
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                      className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
                    >
                      Unarchive
                    </button>
                  </div>
                </article>
              ))}
              {!archivedCourses.length && (
                <p className="text-sm text-slate-500">No archived courses.</p>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
