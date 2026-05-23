import { WifiOff, Users, Lock } from "lucide-react";

const ConnectionBanner = ({
  isConnected,
  onlineAgents = [],
  activeLocks = 0,
}) => {
  if (isConnected) {
    return null;
  }

  return (
    <section className="connection-banner connection-lost">
      <div>
        <span className="signal"></span>
        <strong>Connection Lost: Reconnecting...</strong>
        <p>Your data might not save until the socket reconnects.</p>
      </div>

      <div className="connection-metrics">
        <span>
          <Users size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />
          {onlineAgents.length} online
        </span>
        <span>
          <Lock size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />
          {activeLocks} locked
        </span>
      </div>
    </section>
  );
};

export default ConnectionBanner;
