import "./load-env.js";
import { createCompositionRoot } from "./composition-root.js";
import { disconnectRedis } from "./lib/redis.js";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const { app, pool, emailWorker, emailQueue } = await createCompositionRoot();

  const server = app.getInstance().listen(PORT, () => {
    console.log(`Auth service listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await emailWorker.close();
    await emailQueue.close();
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
