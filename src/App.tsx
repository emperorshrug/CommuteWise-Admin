import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GlobalSidebar from "./components/GlobalSidebar";
import RouteManager from "./pages/RouteManager";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
        {/* --- GLOBAL SIDEBAR LIVES HERE ONCE --- */}
        <GlobalSidebar />

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<RouteManager />} />
            {/* ADD OTHER ROUTES HERE LATER, E.G.: */}
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
