import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "../components/layout/Sidebar/Sidebar";
import useAuth from "../hooks/useAuth";
import usePersistentState from "../hooks/usePersistentState";
import { getMenuItems } from "../config/navigation";
import { confirmAction } from "../utils/alerts";
import logo from "../assets/venglish.jpeg";
import "./SidebarLayout.css";

// Estructura con barra lateral + contenido, compartida por todos los roles. Cada rol la configura
// con su menú y textos (ver AdminLayout y StudentLayout). Las páginas se renderizan en <Outlet />
// (o como `children` cuando la ruta es compartida con otros roles).
export default function SidebarLayout({ menu, roleLabel, subtitle, logoutMessage, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = usePersistentState("venglish.sidebar.collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const confirmed = await confirmAction({
      title: "¿Cerrar sesión?",
      text: logoutMessage,
      confirmText: "Cerrar sesión",
    });
    if (!confirmed) return;
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={`admin-shell${collapsed ? " is-collapsed" : ""}`}>
      <Sidebar
        items={getMenuItems(menu, user)}
        user={user}
        roleLabel={roleLabel}
        subtitle={subtitle}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      {mobileOpen && <div className="admin-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </button>
          <img src={logo} alt="VEnglish Academy" className="admin-topbar-logo" />
        </header>

        <main className="admin-content">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
