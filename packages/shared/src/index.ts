// pg-pool is NOT re-exported here — it does a real `import pg from "pg"` (uses `fs`/`dns`),
// and this barrel is now value-imported by frontend code (tracks.ts helpers), so bundling it
// here would pull `pg` into the browser build. Backend services import it from the
// "@ai-learning-platform/shared/pg-pool" subpath instead — see package.json's "exports".
export * from "./auth-contracts";
export * from "./course-contracts";
export * from "./course-generation-contracts";
export * from "./internal-service-middleware";
export * from "./subscription-contracts";
export * from "./chat-contracts";
export * from "./assessment-contracts";
export * from "./progress-contracts";
export * from "./tracks";
