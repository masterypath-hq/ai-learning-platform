import type { CourseResponse, LessonResponse } from "@ai-learning-platform/shared";
import { LandingClient } from "./LandingClient";

// Server-to-server, same pattern every backend service uses to reach course-service —
// bypasses the gateway (which requires a JWT for /api/courses/*) since this page is anonymous.
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL ?? "http://localhost:3003";

async function fetchFeaturedLesson(): Promise<LessonResponse | null> {
  try {
    const listRes = await fetch(`${COURSE_SERVICE_URL}/api/v1/courses`, { next: { revalidate: 300 } });
    if (!listRes.ok) return null;
    const { courses } = (await listRes.json()) as { courses: { id: string; slug: string }[] };
    const cyber = courses.find((c) => c.slug === "cybersecurity");
    if (!cyber) return null;

    const courseRes = await fetch(`${COURSE_SERVICE_URL}/api/v1/courses/${cyber.id}`, { next: { revalidate: 300 } });
    if (!courseRes.ok) return null;
    const course = (await courseRes.json()) as CourseResponse;
    return course.modules[0]?.lessons[0] ?? null;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const lessonPreview = await fetchFeaturedLesson();
  return <LandingClient lessonPreview={lessonPreview} />;
}
