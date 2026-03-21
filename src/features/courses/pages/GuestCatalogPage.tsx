import { useEffect, useState } from "react";
import type { CatalogCourse } from "../../../shared/types/lms";
import { StudentCatalogPanel } from "../components/discover/StudentCatalogPanel";
import { fetchPublicCatalogCourses } from "../services/course.service";

export function GuestCatalogPage(props: {
  api: (path: string, init?: RequestInit) => Promise<any>;
  setMessage: (m: string) => void;
  onRequestLogin: () => void;
}) {
  const { api, setMessage, onRequestLogin } = props;

  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState<
    number | null
  >(null);
  const [keyInput, setKeyInput] = useState<Record<number, string>>({});
  const [showEnrollRequest, setShowEnrollRequest] = useState<
    Record<number, boolean>
  >({});

  async function loadCatalog(query = catalogQuery) {
    try {
      setCatalog(await fetchPublicCatalogCourses(api, query));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    loadCatalog("").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StudentCatalogPanel
      studentViewMode="search"
      userRole="GUEST"
      catalogQuery={catalogQuery}
      setCatalogQuery={setCatalogQuery}
      loadCatalog={loadCatalog}
      catalog={catalog}
      selectedCatalogCourseId={selectedCatalogCourseId}
      setSelectedCatalogCourseId={setSelectedCatalogCourseId}
      selectedCatalogCourse={null}
      showEnrollRequest={showEnrollRequest}
      setShowEnrollRequest={setShowEnrollRequest}
      keyInput={keyInput}
      setKeyInput={setKeyInput}
      requestEnroll={async () => {
        onRequestLogin();
      }}
      onRequestLogin={onRequestLogin}
      progressByCourseId={{}}
    />
  );
}
