/**
 * Load .env before any other code. In Docker, ENV_FILE_PATH points to mounted .env.
 */
import dns from "node:dns";
import { config } from "dotenv";

dns.setDefaultResultOrder("ipv4first");
config(process.env.ENV_FILE_PATH ? { path: process.env.ENV_FILE_PATH } : {});
