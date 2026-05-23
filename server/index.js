const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Load environment variables
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup production-ready CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

console.log(`[CORS] Configuring allowed origins: ${allowedOrigins.join(", ")}`);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const server = http.createServer(app);

// Initialize Socket.IO with WebSocket transport optimization and credentials support
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket"],
});

// Database state: ticket objects
let tickets = [
  {
    id: 1,
    customer: "Emma Watson",
    subject: "Truck delivery delayed",
    status: "Open",
    priority: "High",
    assignee: "Garima",
    updatedAt: "2 mins ago",
    locked: false,
    lockedBy: null,
    lockedById: null,
  },
  {
    id: 2,
    customer: "John Carter",
    subject: "Payment processing failed",
    status: "Pending",
    priority: "Medium",
    assignee: "Rahul",
    updatedAt: "10 mins ago",
    locked: false,
    lockedBy: null,
    lockedById: null,
  },
  {
    id: 3,
    customer: "Sophia Lee",
    subject: "Duplicate shipment issue",
    status: "Resolved",
    priority: "Low",
    assignee: "Aman",
    updatedAt: "1 hour ago",
    locked: false,
    lockedBy: null,
    lockedById: null,
  },
];

// Active online agent tracking
let agents = [];

// Default registered agents directory
const defaultAgents = ["Garima", "Rahul", "Aman"];

// Joined agents who logged in during this session
let joinedAgents = [];

const getRegisteredAgents = () => {
  const assignees = tickets.map((t) => t.assignee).filter(Boolean);
  const allNames = new Set([...defaultAgents, ...joinedAgents, ...assignees]);
  return Array.from(allNames);
};

/**
 * Enterprise Concurrency Control: in-memory locks map
 * Maps: ticketId (Number) -> { socketId (String), agentName (String) }
 */
const locks = new Map();

const broadcastAgentsList = () => {
  const registered = getRegisteredAgents();
  const payload = registered.map((name) => {
    const activeSockets = agents.filter((a) => a.name === name).map(a => a.id);
    return {
      name,
      isOnline: activeSockets.length > 0,
      socketIds: activeSockets,
    };
  });
  io.emit("all_agents", payload);
};

// Helper to broadcast presence updates
const broadcastPresence = () => {
  io.emit("presence_updated", agents);
  broadcastAgentsList();
};

// Helper to find a ticket by ID
const findTicket = (ticketId) => {
  return tickets.find((ticket) => ticket.id === Number(ticketId));
};

/**
 * Releases a ticket lock globally
 * @param {Number} ticketId The ID of the ticket to unlock
 */
const releaseTicket = (ticketId) => {
  const numericId = Number(ticketId);
  
  // Clear from in-memory Map if still present
  locks.delete(numericId);

  // Sync state back to the database array
  tickets = tickets.map((ticket) =>
    ticket.id === numericId
      ? {
          ...ticket,
          locked: false,
          lockedBy: null,
          lockedById: null,
        }
      : ticket
  );

  console.log(`[LOCK] Ticket ${numericId} released and unlocked.`);

  // Broadcast unlock events supporting both conventions
  io.emit("ticket_unlocked", { ticketId: numericId });
  io.emit("ticket-unlocked", { ticketId: numericId });
};

io.on("connection", (socket) => {
  console.log(`[CONN] New client connected: Socket ID = ${socket.id}, IP = ${socket.handshake.address}`);

  // Send initial data to client
  socket.emit("all_tickets", tickets);
  broadcastPresence();

  // Handle agent registration (both underscore & hyphen conventions)
  const handleAgentJoined = ({ name }) => {
    socket.data.agentName = name;
    
    // Remove stale session references if any
    agents = agents.filter((agent) => agent.id !== socket.id);
    
    agents.push({
      id: socket.id,
      name,
    });

    if (!joinedAgents.includes(name)) {
      joinedAgents.push(name);
    }

    console.log(`[AGENT] Registered agent "${name}" on socket ${socket.id}`);
    broadcastPresence();
  };
  socket.on("agent_joined", handleAgentJoined);
  socket.on("agent-joined", handleAgentJoined);

  // Handle agent logout presence cleanup
  socket.on("logout_presence", () => {
    console.log(`[LOGOUT] Agent "${socket.data.agentName}" logged out on socket ${socket.id}`);
    agents = agents.filter((agent) => agent.id !== socket.id);
    
    // Release locks held by the logged out socket
    for (const [ticketId, lock] of locks.entries()) {
      if (lock.socketId === socket.id) {
        console.log(`[LOGOUT_CLEANUP] Releasing lock on ticket ${ticketId} due to logout`);
        releaseTicket(ticketId);
      }
    }
    
    broadcastPresence();
  });

  // Handle ticket lock requests (concurrency locking)
  const handleLockTicket = (payload, reply = () => {}) => {
    const { ticketId, agent } = payload;
    const numericId = Number(ticketId);
    const ticket = findTicket(numericId);
    const agentName = agent || socket.data.agentName || "Unknown agent";

    console.log(`[LOCK_REQ] Socket ${socket.id} (Agent: ${agentName}) requesting lock on ticket ${numericId}`);

    if (!ticket) {
      const errResponse = { ok: false, message: "Ticket not found." };
      reply(errResponse);
      return;
    }

    // 1. Check if the ticket is already locked by someone else
    if (locks.has(numericId)) {
      const activeLock = locks.get(numericId);
      if (activeLock.socketId !== socket.id) {
        console.warn(`[CONCURRENCY_CONFLICT] Rejected lock request for ticket ${numericId}. Locked by ${activeLock.agentName} (${activeLock.socketId})`);
        
        const rejectResponse = {
          ok: false,
          ticketId: numericId,
          lockedBy: activeLock.agentName,
          message: `This ticket is currently locked by another agent (${activeLock.agentName}).`,
        };
        
        socket.emit("lock_rejected", rejectResponse);
        socket.emit("lock-rejected", rejectResponse);
        reply(rejectResponse);
        return;
      }
    }

    // 2. Set the lock in our Map (concurrency tracking)
    locks.set(numericId, {
      socketId: socket.id,
      agentName,
    });

    // 3. Sync tickets list state (for initial-page-load data)
    tickets = tickets.map((item) =>
      item.id === numericId
        ? {
            ...item,
            locked: true,
            lockedBy: agentName,
            lockedById: socket.id,
          }
        : item
    );

    // 4. Broadcast lock confirmation to all clients
    const lockPayload = {
      ticketId: numericId,
      lockedBy: agentName,
      lockedById: socket.id,
    };

    io.emit("ticket_locked", lockPayload);
    io.emit("ticket-locked", lockPayload);

    console.log(`[LOCK_ACQUIRED] Ticket ${numericId} successfully locked by "${agentName}"`);

    reply({
      ok: true,
      ticketId: numericId,
    });
  };
  socket.on("lock_ticket", handleLockTicket);
  socket.on("lock-ticket", handleLockTicket);

  // Handle ticket unlock requests
  const handleUnlockTicket = ({ ticketId }, reply = () => {}) => {
    const numericId = Number(ticketId);
    const ticket = findTicket(numericId);

    console.log(`[UNLOCK_REQ] Socket ${socket.id} requesting unlock on ticket ${numericId}`);

    if (!ticket) {
      const errResponse = { ok: false, message: "Ticket not found." };
      reply(errResponse);
      return;
    }

    // Check if lock exists
    if (!locks.has(numericId)) {
      reply({ ok: true, ticketId: numericId });
      return;
    }

    const activeLock = locks.get(numericId);
    
    // Ensure only the lock owner can unlock
    if (activeLock.socketId !== socket.id) {
      console.warn(`[CONCURRENCY_VIOLATION] Socket ${socket.id} attempted to unlock ticket ${numericId} locked by ${activeLock.socketId}`);
      
      const rejectResponse = {
        ok: false,
        ticketId: numericId,
        lockedBy: activeLock.agentName,
        message: "You cannot unlock a ticket locked by another agent.",
      };
      reply(rejectResponse);
      return;
    }

    // Remove lock from Map and release ticket
    releaseTicket(numericId);

    reply({
      ok: true,
      ticketId: numericId,
    });
  };
  socket.on("unlock_ticket", handleUnlockTicket);
  socket.on("unlock-ticket", handleUnlockTicket);

  // Handle ticket updates
  const handleUpdateTicket = (updatedTicket, reply = () => {}) => {
    const numericId = Number(updatedTicket.id);
    const existingTicket = findTicket(numericId);

    console.log(`[UPDATE_REQ] Socket ${socket.id} requesting update on ticket ${numericId}`);

    if (!existingTicket) {
      reply({ ok: false, message: "Ticket not found." });
      return;
    }

    // Verify lock constraints before saving edits
    if (locks.has(numericId)) {
      const activeLock = locks.get(numericId);
      if (activeLock.socketId !== socket.id) {
        console.warn(`[WRITE_BLOCKED] Write rejected on ticket ${numericId}. Locked by ${activeLock.socketId}`);
        
        const response = {
          ok: false,
          ticketId: numericId,
          lockedBy: activeLock.agentName,
          message: "Write blocked: This ticket is currently locked by another agent.",
        };
        socket.emit("ticket_update_rejected", response);
        socket.emit("ticket-update-rejected", response);
        reply(response);
        return;
      }
    }

    // Sanitize incoming payload fields to preserve lock states
    const safeChanges = { ...updatedTicket };
    delete safeChanges.editedBy;
    delete safeChanges.locked;
    delete safeChanges.lockedBy;
    delete safeChanges.lockedById;

    // Set the assignee to the agent making these edits
    safeChanges.assignee = socket.data.agentName || existingTicket.assignee || "Garima";

    const nextTicket = {
      ...existingTicket,
      ...safeChanges,
      id: existingTicket.id,
      locked: existingTicket.locked,
      lockedBy: existingTicket.lockedBy,
      lockedById: existingTicket.lockedById,
    };

    tickets = tickets.map((t) => (t.id === nextTicket.id ? nextTicket : t));

    // Broadcast update to all clients
    io.emit("ticket_updated", nextTicket);
    io.emit("ticket-updated", nextTicket);

    console.log(`[UPDATED] Ticket ${numericId} successfully updated and broadcasted.`);

    reply({
      ok: true,
      ticket: nextTicket,
    });
  };
  socket.on("update_ticket", handleUpdateTicket);
  socket.on("update-ticket", handleUpdateTicket);

  // Handle ticket creation
  const handleCreateTicket = (newTicket) => {
    const ticket = {
      ...newTicket,
      id: newTicket.id || Date.now(),
      locked: false,
      lockedBy: null,
      lockedById: null,
    };

    tickets.unshift(ticket);
    console.log(`[CREATED] New ticket ${ticket.id} created by ${ticket.createdBy || "Agent"}`);

    io.emit("ticket_created", ticket);
    io.emit("ticket-created", ticket);
  };
  socket.on("create_ticket", handleCreateTicket);
  socket.on("create-ticket", handleCreateTicket);

  // Ghost Disconnect Handler
  // Automatically detects socket termination and immediately releases locks
  socket.on("disconnect", () => {
    console.log(`[DISCONN] Client disconnected: Socket ID = ${socket.id}`);
    
    // Remove agent presence
    agents = agents.filter((agent) => agent.id !== socket.id);

    // Identify all locks held by this socket and release them
    for (const [ticketId, lock] of locks.entries()) {
      if (lock.socketId === socket.id) {
        console.log(`[GHOST_CLEANUP] Socket ${socket.id} disconnected holding lock on ticket ${ticketId}. Auto-unlocking...`);
        releaseTicket(ticketId);
      }
    }

    broadcastPresence();
  });
});

// Setup Port Address Collisions protection
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[ERROR] Port ${PORT} is already in use.`);
    console.error("Please terminate the existing backend server process first.");
    console.error(`Windows stop utility command: netstat -ano | findstr :${PORT}`);
    console.error("Then kill: taskkill /PID <PID> /F");
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  console.log(`[START] Concurrency server listening on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
});
