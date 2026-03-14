import "./load-env.js";
import { createCompositionRoot } from "./composition-root.js";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const { app, pool } = await createCompositionRoot();

  const server = app.getInstance().listen(PORT, () => {
    console.log(`Auth service listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
