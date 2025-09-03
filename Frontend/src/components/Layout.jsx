import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/api/users/logout");
    } catch {}
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-900">
          <div className="py-8 flex items-center justify-center font-extrabold text-brand-400 text-3xl tracking-wide border-b border-slate-700 shadow-md">
            StudyPath
          </div>
          <nav className="flex-1 px-3 space-y-2 mt-6">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/sessions">Study Sessions</NavItem>
            <NavItem to="/progress">Progress</NavItem>
            <NavItem to="/goals">Goals</NavItem>
          </nav>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
            {/* LEFT: app name (mobile), user name, theme toggle */}
            <div className="flex items-center gap-3">
              <div className="md:hidden font-semibold text-brand-500">
                StudyPath
              </div>
              {user && <span className="text-sm opacity-80">{user.name}</span>}
            </div>
            {/* RIGHT: logout */}
            {user && (
              <button onClick={handleLogout} className="btn btn-primary">
                Logout
              </button>
            )}
          </header>

          {/* Page content */}
          <main className="p-4">
            {/* subtle page transition */}
            <div key={location.pathname} className="fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block px-4 py-2 rounded-lg text-base font-medium tracking-wide transition-all duration-300 ease-out
        ${
          isActive
            ? "bg-brand-500 text-white shadow-md"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
