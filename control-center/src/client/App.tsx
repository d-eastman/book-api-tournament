import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { OperatorPage } from "./pages/OperatorPage";
import { TournamentPage } from "./pages/TournamentPage";
import { ResultsPage } from "./pages/ResultsPage";

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 text-sm font-medium rounded-t transition ${
          isActive
            ? "bg-gray-800 text-gray-100 border-b-2 border-blue-500"
            : "text-gray-400 hover:text-gray-200"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="text-lg font-bold tracking-tight hover:text-blue-400 transition">
              Book API Tournament
            </Link>
            <nav className="flex gap-1">
              <NavTab to="/operator" label="Operator" />
              <NavTab to="/tournament" label="Tournament" />
              <NavTab to="/results" label="Results" />
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/operator" element={<OperatorPage />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
