import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://live-ops-helpdesk-zogi.onrender.com";

console.log(`[Socket.IO Client] Initializing connection to: ${SOCKET_URL} with websocket transport.`);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"], // WebSockets-only optimized transport
  withCredentials: true,     // Support backend credentials configuration
});
