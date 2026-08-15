"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** The callback URL is shared by both providers — stash which one was used so /auth/callback knows which exchange endpoint to call. */
function rememberProvider(provider: "google" | "github") {
  sessionStorage.setItem("oauth_provider", provider);
}

export function OAuthButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={`${API_URL}/api/auth/google`}
        onClick={() => rememberProvider("google")}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong text-sm font-medium hover:bg-surface-hover"
      >
        <span className="text-xs font-bold text-[#4285F4]">G</span>
        Google
      </a>
      <a
        href={`${API_URL}/api/auth/github`}
        onClick={() => rememberProvider("github")}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong text-sm font-medium hover:bg-surface-hover"
      >
        <span className="text-xs font-bold">GH</span>
        GitHub
      </a>
    </div>
  );
}
