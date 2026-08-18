/**
 * Stage 4: generates the full module → lesson tree for catalog courses and persists it
 * incrementally, module by module, using ai-service's generation endpoints + course-service's
 * checkpoint endpoints directly (no gateway/auth — internal-secret protected).
 *
 * Every module's lessons are persisted to the DB the moment they're generated, so a failure
 * partway through a course keeps everything generated before the failure. Re-running the same
 * command resumes: it skips the outline call if one is already persisted, and skips any module
 * whose lessons are already saved — no Claude calls, no regeneration, unless --force is passed.
 *
 * Usage:
 *   npm run generate:course-content -- cybersecurity              # generate/resume one track
 *   npm run generate:course-content -- cybersecurity --dry-run     # show the plan, zero API calls
 *   npm run generate:course-content -- cybersecurity --phase foundation   # only that phase's modules
 *   npm run generate:course-content -- cybersecurity --force       # wipe and regenerate from scratch
 *   npm run generate:course-content -- --status                    # what's generated vs missing, all tracks
 *   npm run generate:course-content                                # all published courses
 *
 * Requires (root .env): INTERNAL_SERVICE_SECRET, ANTHROPIC_API_KEY (set on ai-service). Run
 * `npm run seed:courses` first so course rows exist.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Agent, setGlobalDispatcher } from "undici";
import type {
  ClaudeUsage,
  CourseOutlineResponse,
  GeneratedModuleOutline,
  GenerationModuleStatus,
  GenerationStatusResponse,
  ModuleLessonsResponse,
  PhaseLevel,
} from "@ai-learning-platform/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

// Module-lesson generation calls routinely exceed Node's default 5-minute fetch headers/body
// timeout. Disable it for this script — a slow generation is fine, a client that gives up on it
// isn't.
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5002";
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL ?? "http://localhost:3003";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

const PHASE_ORDER: Record<PhaseLevel, number> = { foundation: 0, intermediate: 1, advanced: 2, mastery: 3 };
// Typical outline size (see CourseOutlineResponseSchema: 6-10 modules) — used only to estimate
// call counts in --dry-run before an outline has actually been generated.
const TYPICAL_MODULE_COUNT = { min: 6, max: 10 };
// Rough $/MTok for claude-sonnet-4-5 (see CLAUDE.md — confirm against current pricing before
// trusting this for budgeting real spend).
const INPUT_COST_PER_MTOK = 3;
const OUTPUT_COST_PER_MTOK = 15;

type TrackCourse = { id: string; slug: string; title: string; description: string | null };
type Flags = { dryRun: boolean; force: boolean; status: boolean; phase: PhaseLevel | null };

function parseFlags(argv: string[]): { trackFilter: string | undefined; flags: Flags } {
  const args = [...argv];
  const flags: Flags = { dryRun: false, force: false, status: false, phase: null };
  let trackFilter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--force") flags.force = true;
    else if (arg === "--status") flags.status = true;
    else if (arg === "--phase") {
      const value = args[++i];
      if (!value || !(value in PHASE_ORDER)) {
        console.error(`--phase requires one of: ${Object.keys(PHASE_ORDER).join(", ")}`);
        process.exit(1);
      }
      flags.phase = value as PhaseLevel;
    } else if (!arg.startsWith("--")) {
      trackFilter = arg;
    }
  }
  return { trackFilter, flags };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: T }> {
  const res = await fetch(url, init);
  const body = (await res.json()) as T;
  return { ok: res.ok, status: res.status, body };
}

function internalHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SERVICE_SECRET! };
}

async function listCourses(trackFilter: string | undefined): Promise<TrackCourse[]> {
  const listRes = await fetch(`${COURSE_SERVICE_URL}/api/v1/courses`);
  if (!listRes.ok) {
    console.error(`Failed to list courses: ${listRes.status} ${await listRes.text()}`);
    process.exit(1);
  }
  const { courses }: { courses: TrackCourse[] } = await listRes.json();
  const targets = trackFilter ? courses.filter((c) => c.slug === trackFilter) : courses;
  if (targets.length === 0) {
    console.error(trackFilter ? `No published course found with slug "${trackFilter}"` : "No published courses found. Run npm run seed:courses first.");
    process.exit(1);
  }
  return targets;
}

async function getStatus(courseId: string): Promise<GenerationStatusResponse> {
  const { ok, status, body } = await fetchJson<{ success: boolean; data: GenerationStatusResponse; error: unknown }>(
    `${COURSE_SERVICE_URL}/api/v1/courses/${courseId}/generation/status`,
    { headers: internalHeaders() }
  );
  if (!ok) throw new Error(`Failed to fetch generation status: ${status} ${JSON.stringify(body)}`);
  return body.data;
}

function formatUsd(usage: ClaudeUsage): string {
  const cost = (usage.inputTokens / 1_000_000) * INPUT_COST_PER_MTOK + (usage.outputTokens / 1_000_000) * OUTPUT_COST_PER_MTOK;
  return `$${cost.toFixed(4)}`;
}

function sumUsage(a: ClaudeUsage, b: ClaudeUsage): ClaudeUsage {
  return { inputTokens: a.inputTokens + b.inputTokens, outputTokens: a.outputTokens + b.outputTokens };
}

/** --status: report what's generated vs missing across every course, no API calls. */
async function runStatusReport(): Promise<void> {
  const courses = await listCourses(undefined);
  console.log(`\nGeneration status for ${courses.length} course(s):\n`);
  for (const course of courses) {
    const status = await getStatus(course.id);
    if (!status.hasOutline) {
      console.log(`○ ${course.title} (${course.slug}) — no outline generated yet`);
      continue;
    }
    const generated = status.modules.filter((m) => m.lessonsGenerated).length;
    const marker = status.isFullyGenerated ? "✓" : "◐";
    console.log(`${marker} ${course.title} (${course.slug}) — ${generated}/${status.modules.length} modules generated`);
    for (const m of status.modules) {
      console.log(`    ${m.lessonsGenerated ? "✓" : "·"} [${m.phase}] ${m.title}`);
    }
  }
  console.log("");
}

/** --dry-run: print the plan and estimated Claude call count for one track, zero API calls. */
async function runDryRun(course: TrackCourse, phase: PhaseLevel | null, force: boolean): Promise<void> {
  console.log(`\n→ Dry run for "${course.title}" (${course.slug})${phase ? ` [phase: ${phase}]` : ""}`);
  if (force) {
    console.log(`  --force: existing outline and modules would be cleared first.`);
  }
  const status = force ? { hasOutline: false, isFullyGenerated: false, modules: [] } : await getStatus(course.id);

  if (!status.hasOutline) {
    const [lo, hi] = [TYPICAL_MODULE_COUNT.min, TYPICAL_MODULE_COUNT.max];
    console.log(`  No outline persisted yet — would generate 1 outline call, then an estimated ${lo}-${hi} module-lesson calls`);
    console.log(`  (exact module count is only known after the outline call runs).`);
    return;
  }
  const targets = phase ? status.modules.filter((m) => m.phase === phase) : status.modules;
  const pending = targets.filter((m) => !m.lessonsGenerated);
  console.log(`  Outline already persisted: ${status.modules.length} modules.`);
  console.log(`  ${targets.length} module(s) in scope${phase ? ` (phase=${phase})` : ""}; ${pending.length} pending, ${targets.length - pending.length} already generated (would be skipped).`);
  console.log(`  Estimated Claude calls this run: ${pending.length} (0 outline calls — already persisted).`);
  for (const m of pending) console.log(`    · [${m.phase}] ${m.title}`);
}

function sortOutlineModules(outline: CourseOutlineResponse): GeneratedModuleOutline[] {
  return [...outline.modules].sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]);
}

async function generateOutline(course: TrackCourse): Promise<{ modules: GenerationModuleStatus[]; usage: ClaudeUsage }> {
  console.log(`  Generating outline...`);
  const genRes = await fetchJson<{ success: boolean; data: CourseOutlineResponse; usage: ClaudeUsage; error: unknown }>(
    `${AI_SERVICE_URL}/internal/courses/outline`,
    {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({ trackSlug: course.slug, title: course.title, description: course.description ?? "" }),
    }
  );
  if (!genRes.ok) throw new Error(`outline generation failed: ${genRes.status} ${JSON.stringify(genRes.body.error)}`);
  console.log(`  ✓ Outline: ${genRes.body.data.modules.length} modules (${formatUsd(genRes.body.usage)}, ${genRes.body.usage.inputTokens}in/${genRes.body.usage.outputTokens}out tokens)`);

  const ordered = sortOutlineModules(genRes.body.data);
  const persistRes = await fetchJson<{ success: boolean; data: { modules: GenerationModuleStatus[] }; error: unknown }>(
    `${COURSE_SERVICE_URL}/api/v1/courses/${course.id}/generation/outline`,
    {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({ ...genRes.body.data, modules: ordered }),
    }
  );
  if (!persistRes.ok) throw new Error(`outline persist failed: ${persistRes.status} ${JSON.stringify(persistRes.body.error)}`);
  return { modules: persistRes.body.data.modules, usage: genRes.body.usage };
}

async function generateAndPersistModuleLessons(course: TrackCourse, module: GenerationModuleStatus): Promise<ClaudeUsage> {
  const lessonsRes = await fetchJson<{ success: boolean; data: ModuleLessonsResponse; usage: ClaudeUsage; error: unknown }>(
    `${AI_SERVICE_URL}/internal/courses/modules/lessons`,
    {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({
        trackSlug: course.slug,
        module: {
          phase: module.phase,
          title: module.title,
          description: module.description,
          keyConcepts: module.keyConcepts,
          durationWeeks: module.durationWeeks,
        },
      }),
    }
  );
  if (!lessonsRes.ok) throw new Error(`lesson generation failed: ${lessonsRes.status} ${JSON.stringify(lessonsRes.body.error)}`);

  const persistRes = await fetchJson<{ success: boolean; error: unknown }>(
    `${COURSE_SERVICE_URL}/api/v1/courses/${course.id}/generation/modules/${module.id}/lessons`,
    { method: "POST", headers: internalHeaders(), body: JSON.stringify(lessonsRes.body.data) }
  );
  if (!persistRes.ok) throw new Error(`lesson persist failed: ${persistRes.status} ${JSON.stringify(persistRes.body.error)}`);

  return lessonsRes.body.usage;
}

/** Resumable generation for one track: reuses a persisted outline if present, skips modules
 * whose lessons are already saved, and persists each module's lessons the moment they're
 * generated so Ctrl-C or a mid-run failure never discards already-paid-for content. A single
 * module's generation failing (retries/JSON-repair exhausted) is logged and skipped — the rest
 * of the track continues. */
async function generateTrack(course: TrackCourse, flags: Flags): Promise<{ failed: string[] }> {
  console.log(`\n→ Generating content for "${course.title}" (${course.slug})${flags.phase ? ` [phase: ${flags.phase}]` : ""}...`);

  if (flags.force) {
    console.log(`  --force: clearing existing outline and modules...`);
    const clearRes = await fetch(`${COURSE_SERVICE_URL}/api/v1/courses/${course.id}/generation`, {
      method: "DELETE",
      headers: internalHeaders(),
    });
    if (!clearRes.ok) throw new Error(`clear failed: ${clearRes.status} ${await clearRes.text()}`);
  }

  let totalUsage: ClaudeUsage = { inputTokens: 0, outputTokens: 0 };
  const status = await getStatus(course.id);
  let modules: GenerationModuleStatus[];

  if (status.hasOutline) {
    console.log(`  Outline already persisted (${status.modules.length} modules) — skipping outline call.`);
    modules = status.modules;
  } else {
    const outlineResult = await generateOutline(course);
    modules = outlineResult.modules;
    totalUsage = sumUsage(totalUsage, outlineResult.usage);
  }

  const targets = flags.phase ? modules.filter((m) => m.phase === flags.phase) : modules;
  const pending = targets.filter((m) => !m.lessonsGenerated);
  const alreadyDone = targets.length - pending.length;
  if (alreadyDone > 0) console.log(`  ${alreadyDone} module(s) already generated — skipping (0 Claude calls for them).`);

  const failed: string[] = [];
  for (const [i, module] of pending.entries()) {
    console.log(`  module ${i + 1}/${pending.length}: [${module.phase}] ${module.title}`);
    try {
      const usage = await generateAndPersistModuleLessons(course, module);
      totalUsage = sumUsage(totalUsage, usage);
      console.log(`    ✓ persisted (${formatUsd(usage)}, ${usage.inputTokens}in/${usage.outputTokens}out tokens)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`    ✗ ${module.title}: ${message} — skipping this module, continuing track.`);
      failed.push(module.title);
    }
  }

  console.log(
    `  Track total this run: ${formatUsd(totalUsage)} (${totalUsage.inputTokens}in/${totalUsage.outputTokens}out tokens).`
  );
  return { failed };
}

async function main() {
  if (!INTERNAL_SERVICE_SECRET) {
    console.error("INTERNAL_SERVICE_SECRET is not set in .env");
    process.exit(1);
  }

  const { trackFilter, flags } = parseFlags(process.argv.slice(2));

  if (flags.status) {
    await runStatusReport();
    return;
  }

  const targets = await listCourses(trackFilter);

  if (flags.dryRun) {
    for (const course of targets) await runDryRun(course, flags.phase, flags.force);
    console.log("\nDry run complete. No Claude calls were made.");
    return;
  }

  const failures: string[] = [];
  for (const course of targets) {
    try {
      const { failed } = await generateTrack(course, flags);
      if (failed.length > 0) {
        console.error(`  ✗ ${course.slug}: ${failed.length} module(s) failed and were skipped: ${failed.join(", ")}`);
        failures.push(course.slug);
      } else {
        console.log(`  ✓ ${course.slug} complete.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${course.slug}: ${message}`);
      failures.push(course.slug);
    }
  }

  console.log(`\nDone. ${targets.length - failures.length}/${targets.length} course(s) fully generated.`);
  if (failures.length > 0) {
    console.error(`Incomplete: ${failures.join(", ")}. Re-run the same command to resume — already-generated modules are skipped.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
