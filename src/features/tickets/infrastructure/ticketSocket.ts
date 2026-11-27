import { io, type Socket } from "socket.io-client";
import type { TicketActor } from "../domain/types";

const sockets = new Map<TicketActor, Socket>();
const tokenRequests = new Map<TicketActor, Promise<string>>();
const socketInitPromises = new Map<TicketActor, Promise<Socket>>();

function socketOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  return new URL(configured).origin;
}

async function requestSocketToken(actor: TicketActor) {
  const pending = tokenRequests.get(actor);
  if (pending) return pending;

  const request = (async () => {
    const response = await fetch("/api/socket-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("SOCKET_AUTH_FAILED");
    const data = await response.json();
    if (typeof data.token !== "string") throw new Error("SOCKET_AUTH_FAILED");
    return data.token as string;
  })();
  tokenRequests.set(actor, request);
  try {
    return await request;
  } finally {
    tokenRequests.delete(actor);
  }
}

export async function getTicketSocket(actor: TicketActor): Promise<Socket> {
  const existing = sockets.get(actor);
  if (existing && (existing.connected || existing.active)) {
    return existing;
  }

  const inflight = socketInitPromises.get(actor);
  if (inflight) return inflight;

  const init = (async () => {
    await requestSocketToken(actor);

    let socket = sockets.get(actor);
    if (!socket) {
      socket = io(socketOrigin(), {
        autoConnect: false,
        path: "/socket.io/",
        transports: ["polling", "websocket"],
        upgrade: true,
        auth: (cb) => {
          requestSocketToken(actor)
            .then((token) => cb({ token }))
            .catch(() => cb({}));
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 10_000,
        randomizationFactor: 0.5,
        timeout: 10_000,
      });

      let refreshingToken = false;
      socket.on("connect_error", async (error) => {
        if (error.message !== "UNAUTHORIZED" || refreshingToken) return;
        refreshingToken = true;
        try {
          await requestSocketToken(actor);
          socket!.connect();
        } catch {
          socket!.disconnect();
        } finally {
          refreshingToken = false;
        }
      });

      sockets.set(actor, socket);
    }

    if (!socket.connected && !socket.active) {
      socket.connect();
    }
    return socket;
  })();

  socketInitPromises.set(actor, init);
  try {
    return await init;
  } finally {
    socketInitPromises.delete(actor);
  }
}
