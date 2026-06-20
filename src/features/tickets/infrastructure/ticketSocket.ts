import { io, type Socket } from "socket.io-client";
import type { TicketActor } from "../domain/types";

const sockets = new Map<TicketActor, Socket>();

function socketOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  return new URL(configured).origin;
}

async function requestSocketToken(actor: TicketActor) {
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
}

export async function getTicketSocket(actor: TicketActor) {
  const token = await requestSocketToken(actor);
  let socket = sockets.get(actor);
  if (!socket) {
    socket = io(socketOrigin(), {
      autoConnect: false,
      transports: ["polling", "websocket"],
      transportOptions: {
        polling: {
          extraHeaders: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        },
      },
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 8,
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
