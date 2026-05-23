import {
  Ticket,
  Users,
  BarChart3,
  Zap,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Headphones,
  CheckCircle2,
} from "lucide-react";

const Sidebar = ({ collapsed, onToggleCollapse, activeTab = "tickets", onTabSelect }) => {

  const menuItems = [
    {
      id: "tickets",
      icon: Ticket,
      label: "Tickets",
    },
    {
      id: "resolved",
      icon: CheckCircle2,
      label: "Resolved",
    },
    {
      id: "agents",
      icon: Users,
      label: "Agents",
    },
    {
      id: "reports",
      icon: BarChart3,
      label: "Reports",
    },
    {
      id: "automation",
      icon: Zap,
      label: "Automation",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>

      <div className="sidebar-top">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <Headphones size={20} />
          </span>
          {!collapsed && <h2>OPS Live</h2>}
        </div>

        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="sidebar-menu">

        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`menu-item ${isActive ? "active" : ""}`}
              data-tooltip={item.label}
              onClick={() => onTabSelect && onTabSelect(item.id)}
              style={{ cursor: "pointer" }}
            >
              <span className="menu-icon">
                <IconComponent size={17} strokeWidth={2.2} />
              </span>
              {!collapsed && <p>{item.label}</p>}
            </div>
          );
        })}

      </div>

    </aside>
  );
};

export default Sidebar;
