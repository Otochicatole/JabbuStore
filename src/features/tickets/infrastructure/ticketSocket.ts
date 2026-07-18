import { io, type Socket } from "socket.io-client";
import type { TicketActor } from "../domain/types";

const sockets = new Map<TicketActor, Socket>();
const tokenRequests = new Map<TicketActor, Promise<string>>();

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

export async function getTicketSocket(actor: TicketActor) {
  let socket = sockets.get(actor);
  if (socket?.connected || socket?.active) return socket;

  const token = await requestSocketToken(actor);
  if (!socket) {
    socket = io(socketOrigin(), {
      autoConnect: false,
      path: "/socket.io/",
      // Start with the proxy-friendly transport and upgrade to WebSocket when
      // the production reverse proxy forwards the Upgrade headers correctly.
      transports: ["polling", "websocket"],
      upgrade: true,
      auth: { token },
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
        socket!.auth = { token: await requestSocketToken(actor) };
        socket!.connect();
      } catch {
        socket!.disconnect();
      } finally {
        refreshingToken = false;
      }
    });
    sockets.set(actor, socket);
  } else {
    socket.auth = { token };
  }
  if (!socket.connected) socket.connect();
  return socket;
}
