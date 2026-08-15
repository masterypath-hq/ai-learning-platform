/**
 * Manual test client for Stage 3's streaming AI tutor chat.
 *
 * Usage: npm run ws-test -- <JWT> ["message to send"]
 *   (or set WS_TEST_JWT in the environment instead of passing the JWT arg)
 *
 * Creates a chat session via the gateway, connects to the websocket service,
 * sends a message, and prints tokens as they stream in.
 */
import { io } from "socket.io-client";

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:4000";
const WEBSOCKET_URL = process.env.WEBSOCKET_URL ?? "http://localhost:4001";

const token = process.argv[2] ?? process.env.WS_TEST_JWT;
const userMessage = process.argv[3] ?? "Can you explain what a binary search tree is?";

if (!token) {
  console.error("Usage: npm run ws-test -- <JWT> [\"message\"]  (or set WS_TEST_JWT)");
  process.exit(1);
}

type ChatEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

async function main() {
  const createRes = await fetch(`${GATEWAY_URL}/api/ai/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subjectArea: "programming", track: "cybersecurity" }),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) {
    console.error("Failed to create chat session:", createBody);
    process.exit(1);
  }
  const sessionId = createBody.data.id;
  console.log(`Created session ${sessionId}`);

  const socket = io(WEBSOCKET_URL, { auth: { token } });

  await new Promise<void>((resolve, reject) => {
    socket.on("connect", () => resolve());
    socket.on("connect_error", (err) => reject(err));
  });
  console.log("Connected to websocket service");

  socket.emit("join_session", { sessionId });

  const done = new Promise<void>((resolve) => {
    socket.on("chat_event", (event: ChatEvent) => {
      if (event.type === "token") {
        process.stdout.write(event.text);
      } else if (event.type === "done") {
        console.log("\n\n[done]");
        resolve();
      } else if (event.type === "error") {
        console.error("\n\n[error]", event.message);
        resolve();
      }
    });
  });

  const sendRes = await fetch(`${GATEWAY_URL}/api/ai/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: userMessage }),
  });
  const sendBody = await sendRes.json();
  if (!sendRes.ok) {
    console.error("Failed to send message:", sendBody);
    process.exit(1);
  }
  console.log(`Sent: "${userMessage}"\n`);

  await done;
  socket.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
