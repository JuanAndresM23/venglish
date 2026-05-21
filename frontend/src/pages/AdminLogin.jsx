

import React, { useState } from "react";

import { Box, Button, Typography, Grid } from "@mui/material";

import { useNavigate } from "react-router-dom";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import "../css/StudentLogin.css";
import API_URL from "../config";

export default function AdminLogin({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const loginRes = await fetch(`${API_URL}/api/admin_login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (loginRes.ok) {
        // 1. Obtenemos los datos del login (donde ahora enviamos el role_level)
        const loginData = await loginRes.json();
        
        console.log("1. Login exitoso. Verificando sesión...");
        
        const userRes = await fetch("http://localhost:5000/api/me", { 
          credentials: "include" 
        });
        
        const userData = await userRes.json();
        
        if (userData.is_logged_in && userData.role === 'admin') {
          console.log("2. Admin confirmado:", userData.name);
          
          // 2. Combinamos la info de sesión con el nivel de rol que vino del login
          const completeUser = {
            ...userData,
            level: loginData.role_level // Agregamos el nivel (1 o 0)
          };

          // 3. Guardamos en el estado global y en localStorage para el Navbar
          setUser(completeUser);
          
          
          navigate("/dashboard", { replace: true });
        } else {
          alert("Error de sesión: El servidor no reconoció el login.");
        }
      } else {
        const errorData = await loginRes.json();
        alert(errorData.error || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error("Error crítico:", err);
      alert("No se pudo conectar con el servidor.");
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
          item 
          xs={0} md={6} 
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
          item 
          xs={12} md={6} 
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
              </Box>
            </form>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}