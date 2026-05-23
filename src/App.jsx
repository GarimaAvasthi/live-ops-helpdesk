import Dashboard from "./pages/Dashboard";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}

export default App;
