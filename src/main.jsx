import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/global.css";
import "./styles/layout.css";
import "./styles/navbar.css";
import "./styles/sidebar.css";
import "./styles/tickets.css";
import "./styles/modal.css";
import "./styles/stats.css";
import "./styles/loader.css";
import "./styles/responsive.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);
