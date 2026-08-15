import "./load-env.js";
import { createCompositionRoot } from "./composition-root.js";
import { disconnectRedis } from "./lib/redis.js";

const PORT = Number(process.env.PORT) || 5004;

async function main() {
  const { app, pool, subscriberRedis } = await createCompositionRoot();

  const server = app.getInstance().listen(PORT, () => {
    console.log(`Progress service listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
    await subscriberRedis.quit();
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
