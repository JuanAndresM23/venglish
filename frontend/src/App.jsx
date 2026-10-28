import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import useAuth from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";
import LoadingState from "./components/ui/LoadingState";

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingState message="Cargando VEnglish..." minHeight="100vh" />;
  }
  return <AppRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
