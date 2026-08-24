import { useQuery } from "@tanstack/react-query";
import type { ListTracksResponse } from "@ai-learning-platform/shared";
import { apiFetch } from "../api-client";

export function useTracks() {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: () => apiFetch<ListTracksResponse>("/api/tracks", { auth: false }),
  });
}
