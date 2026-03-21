export type ApiClient = (
  path: string,
  init?: RequestInit,
) => Promise<any>;

type AuthHeaders = Record<string, string>;

export async function fetchCatalogCourses(
  api: ApiClient,
  headers: AuthHeaders,
  query: string,
) {
  return api(`/courses/catalog?query=${encodeURIComponent(query)}`, { headers });
}

export async function fetchPublicCatalogCourses(api: ApiClient, query: string) {
  return api(`/public/courses/catalog?query=${encodeURIComponent(query)}`);
}

export async function sendEnrollRequest(
  api: ApiClient,
  headers: AuthHeaders,
  courseId: number,
  key: string,
) {
  return api(`/courses/${courseId}/enroll-request`, {
    method: "POST",
    headers,
    body: JSON.stringify({ key }),
  });
}

export async function fetchPendingEnrollments(
  api: ApiClient,
  headers: AuthHeaders,
  courseId: number,
) {
  return api(`/courses/${courseId}/enrollments/pending`, { headers });
}

export async function fetchCourseRoster(
  api: ApiClient,
  headers: AuthHeaders,
  courseId: number,
) {
  return api(`/courses/${courseId}/students`, { headers });
}

export async function removeSelfEnrollment(
  api: ApiClient,
  headers: AuthHeaders,
  courseId: number,
) {
  return api(`/courses/${courseId}/enrollment/me`, {
    method: "DELETE",
    headers,
  });
}

export async function removeStudentEnrollment(
  api: ApiClient,
  headers: AuthHeaders,
  courseId: number,
  enrollmentId: number,
) {
  return api(`/courses/${courseId}/enrollments/${enrollmentId}`, {
    method: "DELETE",
    headers,
  });
}

export async function removeAllStudentsInSection(
  api: ApiClient,
  headers: AuthHeaders,
  courseId: number,
  sectionId: number,
) {
  return api(`/courses/${courseId}/sections/${sectionId}/enrollments`, {
    method: "DELETE",
    headers,
  });
}
