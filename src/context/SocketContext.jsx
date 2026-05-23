import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { Headphones, ArrowRight } from "lucide-react";

import { socket } from "../services/socket";
import { SocketContext } from "./socketContextValue";

// Sleek glassmorphic Login Screen Component
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a valid agent name.");
      return;
    }
    if (name.trim().length > 20) {
      setError("Name must be 20 characters or less.");
      return;
    }
    onLogin(name.trim());
  };

  return (
    <div className="login-screen-overlay">
      <div className="login-card">
        <div className="login-logo-icon">
          <Headphones size={36} />
        </div>
        <h1>OPS Live Helpdesk</h1>
        <p>Enter your agent name to connect and start locking tickets in realtime.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="agent-name-input">Agent Name</label>
            <input
              id="agent-name-input"
              type="text"
              placeholder="e.g. Dakota, Grey, Alex..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              maxLength={20}
              autoComplete="off"
            />
            {error && <span className="login-error-msg">{error}</span>}
          </div>
          <button type="submit" className="login-submit-btn">
            Connect Workspace <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

const savedAgentName = window.localStorage.getItem("agentName");

export const SocketProvider = ({
  children,
}) => {
  // Dynamic Agent Name state (starts empty if not set in local storage)
  const [agentName, setAgentName] = useState(savedAgentName || "");
  
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  
  // Globally synchronized tickets state
  const [tickets, setTickets] = useState([]);
  const [freshTicketId, setFreshTicketId] = useState(null);

  // Keep a Ref to the current agent name to avoid stale closures in socket callbacks
  const agentNameRef = useRef(agentName);
  useEffect(() => {
    agentNameRef.current = agentName;
  }, [agentName]);

  // Helper function to emit events with timeout/acknowledgement handling
  const emitWithAck = (eventName, payload) => {
    if (!socket.connected) {
      console.warn(`[SocketContext] Blocked emit for ${eventName}: socket not connected.`);
      return Promise.resolve({
        ok: false,
        message: "Connection Lost: Reconnecting...",
      });
    }

    return new Promise((resolve) => {
      console.log(`[SocketContext] Emitting event: ${eventName}`, payload);
      socket.timeout(4000).emit(eventName, payload, (error, response) => {
        if (error) {
          console.error(`[SocketContext] Event ${eventName} failed or timed out:`, error);
          resolve({
            ok: false,
            message: "Server did not respond. Please try again.",
          });
          return;
        }

        console.log(`[SocketContext] Received ack for ${eventName}:`, response);
        resolve(response || { ok: true });
      });
    });
  };

  // Concurrency Locking API Methods
  const lockTicket = async (ticketId) => {
    const result = await emitWithAck("lock_ticket", {
      ticketId,
      agent: agentName,
    });
    
    if (result.ok) {
      // Add the ticketId to local storage locks registry
      const currentLocked = JSON.parse(window.localStorage.getItem("myLockedTickets") || "[]");
      if (!currentLocked.includes(Number(ticketId))) {
        currentLocked.push(Number(ticketId));
        window.localStorage.setItem("myLockedTickets", JSON.stringify(currentLocked));
        console.log(`[LocalStorage] Registered persistent lock for ticket ${ticketId}`);
      }
    }
    return result;
  };

  const unlockTicket = async (ticketId) => {
    const result = await emitWithAck("unlock_ticket", {
      ticketId,
    });
    
    if (result.ok) {
      // Remove the ticketId from local storage locks registry
      const currentLocked = JSON.parse(window.localStorage.getItem("myLockedTickets") || "[]");
      const nextLocked = currentLocked.filter((id) => id !== Number(ticketId));
      window.localStorage.setItem("myLockedTickets", JSON.stringify(nextLocked));
      console.log(`[LocalStorage] Removed lock for ticket ${ticketId}`);
    }
    return result;
  };

  const createTicket = (ticket) => {
    socket.emit("create_ticket", {
      ...ticket,
      createdBy: agentName,
    });
  };

  const saveTicketChanges = (updatedTicket) => {
    return emitWithAck("update_ticket", {
      ...updatedTicket,
    });
  };

  // Login handler
  const loginAgent = (name) => {
    console.log(`[Login] Logging in as agent: ${name}`);
    window.localStorage.setItem("agentName", name);
    setAgentName(name);
    if (socket.connected) {
      socket.emit("agent_joined", {
        name,
      });
    }
  };

  // Logout handler
  const logoutAgent = () => {
    console.log(`[Logout] Logging out agent: ${agentName}`);
    window.localStorage.removeItem("agentName");
    window.localStorage.removeItem("myLockedTickets"); // Clean locks list upon logout
    setAgentName("");
    socket.emit("logout_presence");
  };

  // Check if Vite dev server has restarted and clear persistent locks
  useEffect(() => {
    const currentDevServerId = typeof __DEV_SERVER_ID__ !== 'undefined' ? String(__DEV_SERVER_ID__) : 'production';
    const savedDevServerId = window.localStorage.getItem("devServerId");

    if (savedDevServerId !== currentDevServerId) {
      console.log(`[Dev Server] Detected new dev server session (${currentDevServerId}). Clearing persistent locks.`);
      window.localStorage.removeItem("myLockedTickets");
      window.localStorage.setItem("devServerId", currentDevServerId);
    }
  }, []);

  useEffect(() => {
    console.log("[SocketContext] Setting up socket listeners...");

    const registerSocketEvents = () => {
      // Clear any pre-existing listeners first to avoid StrictMode double-binding
      socket.off("connect");
      socket.off("disconnect");
      socket.off("presence_updated");
      socket.off("all_agents");
      socket.off("all_tickets");
      socket.off("ticket_created");
      socket.off("ticket-created");
      socket.off("ticket_updated");
      socket.off("ticket-updated");
      socket.off("ticket_locked");
      socket.off("ticket-locked");
      socket.off("ticket_unlocked");
      socket.off("ticket-unlocked");

      // Bind events with logging and state updates
      socket.on("connect", () => {
        console.log(`[Socket] Connected successfully. Socket ID: ${socket.id}`);
        setIsConnected(true);
        setSocketId(socket.id);
        
        // Only register agent presence if agentName is filled
        if (agentNameRef.current) {
          socket.emit("agent_joined", {
            name: agentNameRef.current,
          });

          // Automatically re-lock any persistent locks in local storage upon reconnection
          const savedLocks = JSON.parse(window.localStorage.getItem("myLockedTickets") || "[]");
          if (savedLocks.length > 0) {
            console.log(`[Reconnect] Re-acquiring persistent locks for tickets:`, savedLocks);
            savedLocks.forEach((ticketId) => {
              socket.emit("lock_ticket", {
                ticketId,
                agent: agentNameRef.current,
              });
            });
          }
        }
      });

      socket.on("disconnect", (reason) => {
        console.log(`[Socket] Disconnected. Reason: ${reason}`);
        setIsConnected(false);
        setSocketId(null);
      });

      socket.on("presence_updated", (agents) => {
        console.log("[Socket] Online agents list updated:", agents);
        setOnlineAgents(agents);
      });

      socket.on("all_agents", (agentsList) => {
        console.log("[Socket] All agents list updated:", agentsList);
        setAllAgents(agentsList);
      });

      socket.on("all_tickets", (nextTickets) => {
        console.log("[Socket] Initial tickets database sync received:", nextTickets);
        setTickets(nextTickets);
      });

      // Ticket creation handler
      const handleTicketCreated = (ticket) => {
        console.log("[Socket] New ticket received:", ticket);
        setTickets((current) => {
          if (current.some((item) => item.id === ticket.id)) {
            return current;
          }
          return [ticket, ...current];
        });
        setFreshTicketId(ticket.id);
      };
      socket.on("ticket_created", handleTicketCreated);
      socket.on("ticket-created", handleTicketCreated);

      // Ticket updates handler
      const handleTicketUpdated = (updatedTicket) => {
        console.log("[Socket] Ticket edits broadcast received:", updatedTicket);
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === updatedTicket.id ? updatedTicket : ticket
          )
        );
      };
      socket.on("ticket_updated", handleTicketUpdated);
      socket.on("ticket-updated", handleTicketUpdated);

      // Realtime lock handling (concurrency tracking)
      const handleTicketLocked = ({ ticketId, lockedBy, lockedById }) => {
        console.log(`[Socket] Lock acquired on ticket ${ticketId} by ${lockedBy} (${lockedById})`);
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  locked: true,
                  lockedBy,
                  lockedById,
                }
              : ticket
          )
        );
      };
      socket.on("ticket_locked", handleTicketLocked);
      socket.on("ticket-locked", handleTicketLocked);

      const handleTicketUnlocked = ({ ticketId }) => {
        console.log(`[Socket] Lock released on ticket ${ticketId}`);
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  locked: false,
                  lockedBy: null,
                  lockedById: null,
                }
              : ticket
          )
        );
      };
      socket.on("ticket_unlocked", handleTicketUnlocked);
      socket.on("ticket-unlocked", handleTicketUnlocked);
    };

    registerSocketEvents();
    socket.connect();

    return () => {
      console.log("[SocketContext] Unmounting provider: cleaning up connection and listeners.");
      
      // Cleanup all event handlers to avoid duplicate trigger bugs
      socket.off("connect");
      socket.off("disconnect");
      socket.off("presence_updated");
      socket.off("all_agents");
      socket.off("all_tickets");
      socket.off("ticket_created");
      socket.off("ticket-created");
      socket.off("ticket_updated");
      socket.off("ticket-updated");
      socket.off("ticket_locked");
      socket.off("ticket-locked");
      socket.off("ticket_unlocked");
      socket.off("ticket-unlocked");
      
      socket.disconnect();
    };
  }, []);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      socketId,
      agentName,
      onlineAgents,
      allAgents,
      tickets,
      freshTicketId,
      lockTicket,
      unlockTicket,
      createTicket,
      saveTicketChanges,
      loginAgent,
      logoutAgent,
    }),
    [isConnected, socketId, onlineAgents, allAgents, tickets, freshTicketId, agentName]
  );

  // If no agent name is specified, display the Login Screen
  if (!agentName) {
    return <LoginScreen onLogin={loginAgent} />;
  }

  return (
    <SocketContext.Provider
      value={value}
    >
      {children}
    </SocketContext.Provider>
  );
};
