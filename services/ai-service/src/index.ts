import "./load-env.js";
import { Agent, setGlobalDispatcher } from "undici";
import { createCompositionRoot } from "./composition-root.js";
import { disconnectRedis } from "./lib/redis.js";

// undici's default headers/body timeout (300s) can kill a long Claude course-content stream
// mid-response — the SDK's fetch calls run through undici's global dispatcher on Node 22, so the
// socket gets closed with a bare "terminated" error well before generation finishes. Course
// content generation legitimately takes minutes per module; disable the timeout rather than
// racing it.
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));

const PORT = Number(process.env.PORT) || 5002;

async function main() {
  const { app, pool } = await createCompositionRoot();

  const server = app.getInstance().listen(PORT, () => {
    console.log(`AI service listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
    await disconnectRedis();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
