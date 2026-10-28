

import React, { useState } from "react";

import { Box, Button, Typography, Grid } from "@mui/material";

import { Link, useNavigate } from "react-router-dom";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import { adminLogin } from "../../api/auth";
import useAuth from "../../hooks/useAuth";
import { alertError } from "../../utils/alerts";

export default function AdminLogin() {
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await adminLogin(username, password);

      const user = await refreshUser();
      if (user?.is_logged_in && user.role === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        alertError("Error de sesión", "El servidor no reconoció el login.");
      }
    } catch (err) {
      alertError(
        err.status ? "No se pudo iniciar sesión" : "Sin conexión",
        err.status ? err.message || "Credenciales incorrectas" : "No se pudo conectar con el servidor."
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #2c3e50 0%, #000000 100%)", // Fondo más oscuro para Admin
        p: 2,
      }}
    >
      <Grid 
        container 
        sx={{ 
          maxWidth: "1000px", 
          width: "100%", 
          borderRadius: "30px", 
          overflow: "hidden", 
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        
        {/* LADO IZQUIERDO: DECORATIVO */}
        <Grid 
          size={{ xs: 12, md: 6 }} 
          sx={{ 
            display: { xs: "none", md: "flex" },
            background: "linear-gradient(135deg, #ff61d2 0%, #fe9090 100%)", // Colores Venglish
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <Box sx={{ textAlign: "center", color: "white" }}>
            <Typography variant="h3" fontWeight="bold" mb={2}>
              Admin Panel
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Gestión académica y control de estudiantes.
            </Typography>
          </Box>
        </Grid>

        {/* LADO DERECHO: FORMULARIO */}
        <Grid 
          size={{ xs: 12, md: 6 }} 
          sx={{ 
            p: { xs: 4, md: 8 }, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center" 
          }}
        >
          <Box width="100%">
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <Box
                sx={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "2px solid #ff61d2"
                }}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 50, color: "white" }} />
              </Box>

              <Typography color="white" fontWeight="bold" variant="h5" sx={{ mt: 3 }}>
                Hola, Maestro
              </Typography>
              <Typography color="white" sx={{ opacity: 0.6 }}>
                Ingresa tus credenciales de administradora
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <input
                  type="text"
                  placeholder="Usuario"
                  className="custom-mui-input"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "white" }}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="custom-mui-input"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "white" }}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 2,
                    borderRadius: "12px",
                    backgroundColor: "#000",
                    border: "1px solid #ff61d2",
                    color: "white",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    "&:hover": { backgroundColor: "#1a1a1a", borderColor: "#ff4bb0" },
                  }}
                >
                  INICIAR SECCION
                </Button>

                <Typography textAlign="center" variant="body2">
                  <Link
                    to="/admin/forgot-password"
                    style={{ color: "#ff9fd8", textDecoration: "none", fontWeight: 600 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </Typography>
              </Box>
            </form>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}