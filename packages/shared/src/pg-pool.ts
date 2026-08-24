import dns from "node:dns";
import pg from "pg";

function normalizeConnectionString(value: string): string {
  let s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

/**
 * Parse postgresql:// or postgres:// URL without using URL() so passwords
 * containing @, :, #, etc. work (no URL-encoding required).
 */
function parseConnectionString(connectionString: string): pg.PoolConfig {
  const withoutProtocol = connectionString.replace(/^\s*postgres(ql)?:\/\//i, "").trim();
  const atIndex = withoutProtocol.lastIndexOf("@");
  if (atIndex === -1) {
    return { connectionString };
  }
  const userPass = withoutProtocol.slice(0, atIndex);
  const hostPortDb = withoutProtocol.slice(atIndex + 1);
  const colonIndex = userPass.indexOf(":");
  const user = colonIndex === -1 ? userPass : userPass.slice(0, colonIndex);
  const password = colonIndex === -1 ? undefined : userPass.slice(colonIndex + 1);
  const slashIndex = hostPortDb.indexOf("/");
  const database = slashIndex === -1 ? "postgres" : hostPortDb.slice(slashIndex + 1).replace(/\?.*$/, "");
  const hostPort = slashIndex === -1 ? hostPortDb : hostPortDb.slice(0, slashIndex);
  const lastColon = hostPort.lastIndexOf(":");
  const host = lastColon === -1 ? hostPort : hostPort.slice(0, lastColon);
  const port = lastColon === -1 ? 5432 : parseInt(hostPort.slice(lastColon + 1), 10) || 5432;
  const ssl =
    host !== "localhost" && !host.startsWith("127.")
      ? { rejectUnauthorized: false, servername: host }
      : false;
  return { user, password, host, port, database, ssl };
}

async function resolveHostToIPv4(serviceName: string, host: string): Promise<string> {
  if (host === "localhost" || host.startsWith("127.")) return host;
  if (host.includes("pooler.supabase.com")) return host;
  try {
    const addresses = await dns.promises.resolve4(host);
    return addresses[0] ?? host;
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : "";
    if (code === "ENODATA" || code === "ENOTFOUND") {
      console.warn(
        `[${serviceName}] Host "${host}" has no IPv4 record. Consider using Supabase's pooler connection string.`
      );
      return host;
    }
    throw err;
  }
}

/**
 * Builds a pg.Pool from a postgresql:// connection string, handling the Supabase
 * pooler case (parsed connection, since URL() mangles passwords with @/:) and the
 * Docker IPv6-only-DNS case (resolves the host to an IPv4 address first).
 */
export async function createPgPool(serviceName: string, rawConnectionString: string): Promise<pg.Pool> {
  const connectionString = normalizeConnectionString(rawConnectionString);
  const isPooler = connectionString.includes("pooler.supabase.com");
  let pool: pg.Pool;

  if (isPooler) {
    const poolConfig = parseConnectionString(connectionString.replace(/\?.*$/, ""));
    console.log(`[${serviceName}] Using Supabase pooler (parsed connection; supports @ in password)`);
    pool = new pg.Pool({
      user: poolConfig.user,
      password: poolConfig.password,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      ssl: { rejectUnauthorized: false, servername: poolConfig.host as string },
    });
  } else {
    const poolConfig = parseConnectionString(connectionString);
    if (poolConfig.host) {
      poolConfig.host = await resolveHostToIPv4(serviceName, poolConfig.host);
    }
    pool = new pg.Pool(poolConfig);
  }

  pool.on("error", (err) => {
    console.error(`[${serviceName}] Idle pg client error (pool recovers automatically):`, err.message);
  });

  return pool;
}
