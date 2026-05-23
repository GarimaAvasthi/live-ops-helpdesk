import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../components/layout/DashboardLayout";

import TicketTable from "../components/tickets/TicketTable";

import TicketCreationForm from "../components/tickets/TicketCreationForm";
import ConnectionBanner from "../components/ui/ConnectionBanner";
import { useSocketContext } from "../hooks/useSocket";

import {
  Truck,
  Inbox,
  Cog,
  Clock,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  BellRing,
  MapPin,
  Timer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CollapsibleSection = ({ title, icon: Icon, defaultOpen = true, children, className = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section ${className} ${isOpen ? "is-open" : "is-closed"}`}>
      <button
        className="collapsible-header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="collapsible-header-left">
          {Icon && <Icon size={16} strokeWidth={2.2} className="collapsible-header-icon" />}
          <span>{title}</span>
        </div>
        <div className={`collapsible-chevron ${isOpen ? "open" : ""}`}>
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </button>
      <div className={`collapsible-body ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="collapsible-body-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

const getAvatarGradient = (name = "") => {
  const colors = [
    ["#3b82f6", "#1d4ed8"], // Blue
    ["#10b981", "#047857"], // Green
    ["#f59e0b", "#b45309"], // Amber
    ["#ef4444", "#b91c1c"], // Red
    ["#8b5cf6", "#6d28d9"], // Purple
    ["#ec4899", "#be185d"], // Pink
    ["#14b8a6", "#0f766e"], // Teal
    ["#f97316", "#c2410c"], // Orange
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
};

const Dashboard = () => {

  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  
  const {
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
  } = useSocketContext();

  const activeLocks = useMemo(
    () => tickets.filter((ticket) => ticket.locked).length,
    [tickets]
  );

  const openCount = tickets.filter(t => t.status.toLowerCase() === "open").length;
  const inProgressCount = tickets.filter(t => t.status.toLowerCase() === "in progress" || t.status.toLowerCase() === "progress").length;
  const pendingCount = tickets.filter(t => t.status.toLowerCase() === "pending").length;
  const resolvedCount = tickets.filter(t => t.status.toLowerCase() === "resolved").length;

  const filteredTickets = useMemo(() => {
    if (activeTab === "resolved") {
      return tickets.filter(t => t.status.toLowerCase() === "resolved");
    }
    // Default to active tickets (i.e. everything except resolved)
    return tickets.filter(t => t.status.toLowerCase() !== "resolved");
  }, [tickets, activeTab]);

  return (
    <DashboardLayout
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      activeTab={activeTab}
      onTabSelect={setActiveTab}
    >
      <div className="dashboard-shell">
        {activeTab === "tickets" && (
          <ConnectionBanner
            isConnected={isConnected}
            onlineAgents={onlineAgents}
            activeLocks={activeLocks}
          />
        )}

        {activeTab === "tickets" && (
          /* Filament Step Tracker Flow */
          <div style={{ padding: "0 0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              <p className="section-kicker" style={{ margin: 0, whiteSpace: "nowrap" }}>How We Process</p>
              <div style={{ flex: 1, height: "1.5px", background: "rgba(148, 163, 184, 0.15)" }}></div>
            </div>
            <section className="filament-tracker-flow" aria-label="Ticket Resolution Lifecycle">
              <div className="filament-step active">
                <div className="filament-step-icon-container">
                  <Inbox size={28} strokeWidth={2} />
                </div>
                <h3>Warehouse / New</h3>
              </div>

              <div className="filament-step-connector" aria-hidden="true">
                <ChevronRight size={22} strokeWidth={2.5} />
              </div>

              <div className="filament-step">
                <div className="filament-step-icon-container">
                  <Cog size={28} strokeWidth={2} />
                </div>
                <h3>Dispatched / In Progress</h3>
              </div>

              <div className="filament-step-connector" aria-hidden="true">
                <ChevronRight size={22} strokeWidth={2.5} />
              </div>

              <div className="filament-step">
                <div className="filament-step-icon-container">
                  <Clock size={28} strokeWidth={2} />
                </div>
                <h3>In Transit / Pending</h3>
              </div>

              <div className="filament-step-connector" aria-hidden="true">
                <ChevronRight size={22} strokeWidth={2.5} />
              </div>

              <div className="filament-step">
                <div className="filament-step-icon-container">
                  <CheckCircle2 size={28} strokeWidth={2} />
                </div>
                <h3>Delivered / Resolved</h3>
              </div>
            </section>
          </div>
        )}

        {(activeTab === "tickets" || activeTab === "resolved") && (
          <section className="ticket-workspace">
              <div className="ticket-workspace-header">
                <div>
                  <p className="section-kicker">Queue</p>
                  <h2>{activeTab === "tickets" ? "Live ticket board" : "Resolved ticket board"}</h2>
                </div>

                <div className="board-status">
                  <span className={isConnected ? "online" : "offline"}>
                    {isConnected ? "Realtime" : "Offline"}
                  </span>
                  <span>{onlineAgents.length} agents</span>
                </div>
              </div>

              {activeTab === "tickets" && (
                <TicketCreationForm
                  createTicket={createTicket}
                  disabled={!isConnected}
                />
              )}

              {activeTab === "tickets" ? (
                <TicketTable
                  tickets={filteredTickets}
                  lockTicket={lockTicket}
                  unlockTicket={unlockTicket}
                  saveTicketChanges={saveTicketChanges}
                  currentSocketId={socketId}
                  isConnected={isConnected}
                  freshTicketId={freshTicketId}
                />
              ) : (
                <div className="ticket-table-container">
                  <div className="table-header" style={{ gridTemplateColumns: "1.2fr 1fr 2fr" }}>
                    <p>Customer</p>
                    <p>Agent</p>
                    <p>Complaint</p>
                  </div>

                  {filteredTickets.length === 0 ? (
                    <div className="empty-tickets-placeholder" style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
                      No resolved tickets found.
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="ticket-row" style={{ gridTemplateColumns: "1.2fr 1fr 2fr", alignItems: "center" }}>
                        <div className="ticket-cell requester">
                          <div className="avatar" style={{ background: getAvatarGradient(ticket.customer) }}>
                            {ticket.customer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 style={{ fontSize: "14px", fontWeight: "600" }}>{ticket.customer}</h4>
                          </div>
                        </div>
                        <div className="ticket-cell assignee-cell" style={{ fontSize: "14px" }}>
                          {ticket.assignee}
                        </div>
                        <div className="ticket-cell subject-cell" style={{ fontSize: "14px" }}>
                          {ticket.subject}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
        )}

        {activeTab === "agents" && (
          <section className="ticket-workspace">
            <div className="ticket-workspace-header">
              <div>
                <p className="section-kicker">Presence</p>
                <h2>Agents directory</h2>
              </div>
              <div className="board-status">
                <span className="online">Live</span>
                <span>{onlineAgents.length} online</span>
              </div>
            </div>

            <div className="ticket-table-container">
              <div className="table-header" style={{ gridTemplateColumns: "1.2fr 1.8fr 1fr" }}>
                <p>Agent Name</p>
                <p>Connection Session ID</p>
                <p>Status</p>
              </div>

              {allAgents.length === 0 ? (
                <div className="empty-tickets-placeholder" style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
                  No agents found.
                </div>
              ) : (
                allAgents.map((agent) => (
                  <div key={agent.name} className="ticket-row" style={{ gridTemplateColumns: "1.2fr 1.8fr 1fr", alignItems: "center" }}>
                    <div className="ticket-cell requester">
                      <div className="avatar" style={{ background: getAvatarGradient(agent.name) }}>
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: "600" }}>
                          {agent.name} {agent.name === agentName ? " (You)" : ""}
                        </h4>
                      </div>
                    </div>
                    <div className="ticket-cell" style={{ fontFamily: "monospace", fontSize: "12.5px", color: "rgba(100,116,139,0.7)" }}>
                      {agent.isOnline ? agent.socketIds.join(", ") : "-"}
                    </div>
                    <div className="ticket-cell">
                      {agent.isOnline ? (
                        <span className="status open" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "12px", fontWeight: "600" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }}></span>
                          Active Now
                        </span>
                      ) : (
                        <span className="status offline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "12px", background: "rgba(100, 116, 139, 0.12)", color: "#64748b", fontSize: "12px", fontWeight: "600" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#64748b", display: "inline-block" }}></span>
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {["reports", "automation", "settings"].includes(activeTab) && (
          <section className="ticket-workspace" style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="ticket-table-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", minHeight: "340px" }}>
              <div className="filament-footer-icon" style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "var(--blue)" }}>
                {activeTab === "reports" && <BarChart3 size={32} style={{ animation: "chartLift 1.5s ease-in-out infinite alternate" }} />}
                {activeTab === "automation" && <Cog size={32} style={{ animation: "spinGear 4s linear infinite" }} />}
                {activeTab === "settings" && <Cog size={32} style={{ animation: "spinGear 4s linear infinite" }} />}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", textTransform: "capitalize", color: "white" }}>
                {activeTab} Center
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "420px", fontSize: "14.5px", lineHeight: "1.6" }}>
                The {activeTab} control dashboard is under construction. Advanced analytical telemetry and node options will sync here in a future release.
              </p>
            </div>
          </section>
        )}

        {/* Filament Footer Grid */}
        {activeTab === "tickets" && (
          <CollapsibleSection title="Platform Features" icon={Cog} defaultOpen={false}>
            <footer className="filament-footer-grid">
              <div className="filament-footer-card">
                <div className="filament-footer-icon" aria-hidden="true">
                  <BarChart3 size={20} strokeWidth={2} />
                </div>
                <div className="filament-footer-text">
                  <h4>Real-time Updates</h4>
                  <p>Track delivery tickets and agent operations instantly.</p>
                </div>
              </div>

              <div className="filament-footer-card">
                <div className="filament-footer-icon" aria-hidden="true">
                  <BellRing size={20} strokeWidth={2} />
                </div>
                <div className="filament-footer-text">
                  <h4>Smart Collision</h4>
                  <p>Prevent double-saving and support agent resolution race conditions.</p>
                </div>
              </div>

              <div className="filament-footer-card">
                <div className="filament-footer-icon" aria-hidden="true">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="filament-footer-text">
                  <h4>Presence Lock</h4>
                  <p>Instantly locks ticket rows to signal active editing.</p>
                </div>
              </div>

              <div className="filament-footer-card">
                <div className="filament-footer-icon" aria-hidden="true">
                  <Timer size={20} strokeWidth={2} />
                </div>
                <div className="filament-footer-text">
                  <h4>Logistics Support</h4>
                  <p>Engineered for high-volume freight incident management.</p>
                </div>
              </div>
            </footer>
          </CollapsibleSection>
        )}
      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
