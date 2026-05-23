import { Sun, Moon } from "lucide-react";
import { useSocketContext } from "../../hooks/useSocket";

const Navbar = ({
  darkMode,
  setDarkMode,
}) => {
  const { isConnected, onlineAgents, agentName, logoutAgent } = useSocketContext();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>OPS Live Helpdesk</h2>
      </div>

      <div className="navbar-right">
        <div className="live-status">
          <span className={`live-dot ${isConnected ? "" : "offline"}`}></span>
          <p>{isConnected ? "Live" : "Offline"}</p>
        </div>

        <div className="presence-stack" aria-label="Online agents">
          {onlineAgents
            .filter((agent) => agent.name !== agentName)
            .slice(0, 4)
            .map((agent) => (
              <span
                key={agent.id}
                title={agent.name}
              >
                {agent.name.charAt(0)}
              </span>
            ))}
        </div>

        <button
          className="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Profile Avatar: Clickable to Logout/Switch Agent */}
        <div
          className="profile-avatar"
          onClick={logoutAgent}
          title="Click to Switch Agent / Log Out"
        >
          {agentName ? agentName.charAt(0) : "A"}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
