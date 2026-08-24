import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse, CourseProgressDetail } from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";

interface Envelope<T> {
  success: boolean;
  data: T;
  error: unknown;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<Envelope<DashboardResponse>>("/api/progress/dashboard").then((r) => r.data),
  });
}

export function useCourseProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-progress", courseId],
    queryFn: () =>
      apiFetch<Envelope<CourseProgressDetail>>(`/api/progress/courses/${courseId}/progress`).then((r) => r.data),
    enabled: !!courseId,
  });
}
