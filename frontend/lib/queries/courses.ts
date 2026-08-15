import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CourseResponse,
  ListEnrolledCoursesResponse,
  PlacementQuestionResponse,
  SkillResponse,
  SelfAssessmentLevel,
  ConfidenceLevel,
  EnrolledCourse,
} from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () => apiFetch<CourseResponse>(`/api/courses/${courseId}`),
    enabled: !!courseId,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ["my-courses"],
    queryFn: () => apiFetch<ListEnrolledCoursesResponse>("/api/courses/me"),
  });
}

export function usePlacementQuestion(courseId: string | undefined, selfAssessedLevel: SelfAssessmentLevel | undefined) {
  return useQuery({
    queryKey: ["placement-question", courseId, selfAssessedLevel],
    queryFn: () =>
      apiFetch<PlacementQuestionResponse>(
        `/api/courses/${courseId}/placement-question?selfAssessedLevel=${selfAssessedLevel}`
      ),
    enabled: !!courseId && !!selfAssessedLevel,
  });
}

export function useSkills(courseId: string | undefined) {
  return useQuery({
    queryKey: ["skills", courseId],
    queryFn: () => apiFetch<{ skills: SkillResponse[] }>(`/api/courses/${courseId}/skills`),
    enabled: !!courseId,
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      courseId: string;
      selfAssessedLevel: SelfAssessmentLevel;
      questionId: string;
      answer: string;
      confidenceRatings: { skillId: string; level: ConfidenceLevel }[];
    }) =>
      apiFetch<EnrolledCourse>(`/api/courses/${input.courseId}/onboarding`, {
        method: "POST",
        body: {
          selfAssessedLevel: input.selfAssessedLevel,
          questionId: input.questionId,
          answer: input.answer,
          confidenceRatings: input.confidenceRatings,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
    },
  });
}

export function useMarkLessonViewed() {
  return useMutation({
    mutationFn: (input: { courseId: string; lessonId: string }) =>
      apiFetch<{ success: boolean; data: null; error: null }>(
        `/api/courses/${input.courseId}/lessons/${input.lessonId}/viewed`,
        { method: "POST" }
      ),
  });
}
