import { useEffect, useState } from "react";

export function AdminSettingsPanel(props: {
  api: any;
  headers: any;
  setMessage: (m: string) => void;
}) {
  const { api, headers, setMessage } = props;
  const [jsonValue, setJsonValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePeriod, setActivePeriod] = useState<"1" | "2">("1");
  const [hideLmsSisFeatures, setHideLmsSisFeatures] = useState(false);
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null);
  const [apiKeyRotatedAt, setApiKeyRotatedAt] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  function extractSettings(payload: any) {
    if (payload && typeof payload === "object" && payload.settings && typeof payload.settings === "object") {
      return payload.settings as Record<string, any>;
    }
    if (payload && typeof payload === "object") {
      return payload as Record<string, any>;
    }
    return {};
  }

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await api("/admin/settings", { headers });
      setJsonValue(JSON.stringify(data || { settings: {} }, null, 2));
      const settings = extractSettings(data);
      setActivePeriod(String(settings.active_period || "1") === "2" ? "2" : "1");
      setHideLmsSisFeatures(Boolean(settings.hide_lms_sis_features));
      const apiSecurity = settings.api_security || {};
      setSecurityEnabled(Boolean(apiSecurity.enabled));
      setHasApiKey(Boolean(apiSecurity.has_key));
      setApiKeyPreview(
        typeof apiSecurity.key_preview === "string" ? apiSecurity.key_preview : null,
      );
      setApiKeyRotatedAt(
        typeof apiSecurity.key_last_rotated_at === "string"
          ? apiSecurity.key_last_rotated_at
          : null,
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Admin Settings</h3>
          <p className="text-xs text-slate-500">
            System-wide configuration payload.
          </p>
        </div>
        <button
          onClick={() => loadSettings()}
          data-keep-action-text="true"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs"
        >
          <span className="material-symbols-outlined text-[1rem]">refresh</span>
          Refresh
        </button>
      </div>
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">Grading Mode</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activePeriod}
            onChange={(e) => setActivePeriod(e.target.value === "2" ? "2" : "1")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="1">MIDTERM</option>
            <option value="2">FINALS</option>
          </select>
          <button
            onClick={async () => {
              try {
                const parsed = JSON.parse(jsonValue || "{}");
                const baseSettings = extractSettings(parsed);
                const nextSettings = { ...baseSettings, active_period: activePeriod };
                await api("/admin/settings", {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({ settings: nextSettings }),
                });
                setJsonValue(JSON.stringify({ settings: nextSettings }, null, 2));
                setMessage(`Active grading mode set to ${activePeriod === "2" ? "FINALS" : "MIDTERM"}.`);
              } catch (e) {
                setMessage(`Failed to update grading mode: ${(e as Error).message}`);
              }
            }}
            disabled={loading}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[1rem]">fact_check</span>
            Apply Mode
          </button>
          <span className="text-xs text-slate-500">
            Controls grade computation context for instructors and students.
          </span>
        </div>
      </div>
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">
          Hide LMS and SIS Features
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setHideLmsSisFeatures((value) => !value)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              hideLmsSisFeatures
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-emerald-300 bg-emerald-50 text-emerald-700"
            }`}
          >
            {hideLmsSisFeatures ? "Enabled (Hidden)" : "Disabled (Visible)"}
          </button>
          <button
            onClick={async () => {
              try {
                const parsed = JSON.parse(jsonValue || "{}");
                const baseSettings = extractSettings(parsed);
                const nextSettings = {
                  ...baseSettings,
                  hide_lms_sis_features: hideLmsSisFeatures,
                };
                await api("/admin/settings", {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({ settings: nextSettings }),
                });
                setJsonValue(JSON.stringify({ settings: nextSettings }, null, 2));
                setMessage(
                  hideLmsSisFeatures
                    ? "Hide LMS and SIS features enabled."
                    : "Hide LMS and SIS features disabled.",
                );
              } catch (e) {
                setMessage(`Failed to update feature toggle: ${(e as Error).message}`);
              }
            }}
            disabled={loading}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[1rem]">toggle_on</span>
            Apply Toggle
          </button>
          <span className="text-xs text-slate-500">
            Hides Grades sections/tabs and identity UI for instructor/student.
          </span>
        </div>
      </div>
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">
          API Security Gate
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSecurityEnabled((value) => !value)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              securityEnabled
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {securityEnabled ? "Enabled" : "Disabled"}
          </button>
          <button
            onClick={async () => {
              try {
                await api("/admin/settings/security", {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({ enabled: securityEnabled }),
                });
                setMessage(
                  securityEnabled
                    ? "API security gate enabled."
                    : "API security gate disabled.",
                );
                await loadSettings();
              } catch (e) {
                setMessage(`Failed to update API security gate: ${(e as Error).message}`);
              }
            }}
            disabled={loading}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[1rem]">shield</span>
            Apply Gate
          </button>
          <button
            onClick={async () => {
              try {
                const payload = await api("/admin/settings/security/api-key/rotate", {
                  method: "POST",
                  headers,
                });
                setNewApiKey(
                  payload && typeof payload.apiKey === "string" ? payload.apiKey : null,
                );
                setMessage(
                  "New API key generated. Copy it now because it will not be shown again.",
                );
                await loadSettings();
              } catch (e) {
                setMessage(`Failed to rotate API key: ${(e as Error).message}`);
              }
            }}
            disabled={loading}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[1rem]">key</span>
            Rotate Key
          </button>
          <button
            onClick={async () => {
              if (!confirm("Revoke the current API key? Existing external clients will stop working.")) {
                return;
              }
              try {
                await api("/admin/settings/security/api-key/revoke", {
                  method: "POST",
                  headers,
                });
                setNewApiKey(null);
                setMessage("API key revoked.");
                await loadSettings();
              } catch (e) {
                setMessage(`Failed to revoke API key: ${(e as Error).message}`);
              }
            }}
            disabled={loading || !hasApiKey}
            data-keep-action-text="true"
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[1rem]">block</span>
            Revoke Key
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <p>
            Current key: {hasApiKey ? apiKeyPreview || "Configured" : "Not configured"}
          </p>
          <p>
            Last rotated: {apiKeyRotatedAt ? new Date(apiKeyRotatedAt).toLocaleString() : "--"}
          </p>
          <p>
            Requests are allowed if they come from the trusted website origin or send a valid
            <code className="ml-1 rounded bg-slate-200 px-1 py-0.5">x-api-key</code>.
          </p>
        </div>
        {newApiKey && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1 text-xs font-semibold text-amber-800">
              New API key (shown once)
            </p>
            <code className="block break-all rounded bg-white px-2 py-1 text-[11px] text-slate-900">
              {newApiKey}
            </code>
          </div>
        )}
      </div>
      <textarea
        value={jsonValue}
        onChange={(e) => setJsonValue(e.target.value)}
        className="min-h-[340px] w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs"
        spellCheck={false}
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            try {
              const parsed = JSON.parse(jsonValue || "{}");
              if (!parsed || typeof parsed !== "object") {
                setMessage("Invalid JSON object.");
                return;
              }
              await api("/admin/settings", {
                method: "PATCH",
                headers,
                body: JSON.stringify(parsed),
              });
              setMessage("Admin settings saved.");
              await loadSettings();
            } catch (e) {
              setMessage(`Invalid JSON or request failed: ${(e as Error).message}`);
            }
          }}
          disabled={loading}
          data-keep-action-text="true"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[1rem]">save</span>
          Save Settings
        </button>
      </div>
    </article>
  );
}
