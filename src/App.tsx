import { useState } from "react";
import GlobalSidebar from "./components/GlobalSidebar";
import RouteManager from "./pages/RouteManager";

// Placeholder pages for demonstration
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-bold text-2xl">
    {title} Page Coming Soon
  </div>
);

function App() {
  const [activePage, setActivePage] = useState("routes");

  return (
    // MAIN LAYOUT CONTAINER
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      {/* 1. Global Navigation (Always Visible) */}
      <GlobalSidebar activePage={activePage} onNavigate={setActivePage} />

      {/* 2. Main Content Area */}
      <main className="flex-1 h-full relative flex flex-col">
        {activePage === "routes" && <RouteManager />}
        {activePage === "analytics" && <PlaceholderPage title="Analytics" />}
        {activePage === "users" && <PlaceholderPage title="Users" />}
        {activePage === "settings" && <PlaceholderPage title="Settings" />}
      </main>
    </div>
  );
}

export default App;
