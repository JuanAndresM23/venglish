import SidebarLayout from "./SidebarLayout";
import useAuth from "../hooks/useAuth";
import { ADMIN_MENU, LEVEL_SUPERADMIN } from "../config/navigation";

export default function AdminLayout({ children }) {
  const { user } = useAuth();

  return (
    <SidebarLayout
      menu={ADMIN_MENU}
      roleLabel={user?.level === LEVEL_SUPERADMIN ? "Superadministrador" : "Docente"}
      subtitle="Panel de gestión"
      logoutMessage="Tendrás que ingresar de nuevo para administrar la academia."
    >
      {children}
    </SidebarLayout>
  );
}
