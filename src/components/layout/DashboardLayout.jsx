import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({
  children,
  darkMode,
  setDarkMode,
  activeTab,
  onTabSelect,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`app ${darkMode ? "dark" : ""} ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        activeTab={activeTab}
        onTabSelect={onTabSelect}
      />

      <div className="main-content">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
