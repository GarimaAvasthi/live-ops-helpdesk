import {
  LayoutList,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function DashboardStats({ tickets }) {

  const openCount = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const pendingCount = tickets.filter(
    (ticket) => ticket.status === "Pending"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  return (
    <div className="stats-grid">

      <div className="stat-card">

        <div className="stat-icon blue">
          <LayoutList size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h3>{tickets.length}</h3>
          <p>Total Tickets</p>
        </div>

      </div>

      <div className="stat-card">

        <div className="stat-icon yellow">
          <Clock size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h3>{pendingCount}</h3>
          <p>Pending</p>
        </div>

      </div>

      <div className="stat-card">

        <div className="stat-icon green">
          <CheckCircle2 size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h3>{resolvedCount}</h3>
          <p>Resolved</p>
        </div>

      </div>

      <div className="stat-card">

        <div className="stat-icon red">
          <AlertTriangle size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h3>{openCount}</h3>
          <p>Open Issues</p>
        </div>

      </div>

    </div>
  );
}

export default DashboardStats;
