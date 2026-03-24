import React, { useState } from "react";
import { Box, Button, Checkbox, Typography, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function StudentLogin({ setUser }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

 const handleLogin = async (e) => {
  e.preventDefault();
  const loginData = {
    student_code: code,
    password: password
  };

  try {
    // 1. URL corregida a /api/student_login para coincidir con Python
    const res = await fetch("http://localhost:5000/api/student_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
      credentials: "include", // <--- VITAL PARA GUARDAR LA SESIÓN
    });

    if (res.ok) {
      // 2. Si el login fue bien, pedimos los datos a /api/me
      const userRes = await fetch("http://localhost:5000/api/me", {
        credentials: "include",
      });
      const userData = await userRes.json();
      
      if (userData.is_logged_in) {
        setUser(userData);
        navigate("/dashboard");
      }
    } else {
      const errorData = await res.json();
      alert(errorData.error || "Código o contraseña incorrectos");
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  }
};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--venglish-bg-gradient)", // Usa tu variable del index.css
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
          boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255, 255, 255, 0.4)", // Más sólido para legibilidad
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {/* LADO IZQUIERDO: BANNER (Vibrante) */}
        <Grid 
          item xs={0} md={6} 
          sx={{ 
            display: { xs: "none", md: "flex" },
            background: "var(--venglish-gradient)", // Rosa a Amarillo
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <Box sx={{ color: "white", textAlign: "center" }}>
            <Typography variant="h3" fontWeight="bold" mb={2}>
              Únete a nuestra <br /> Comunidad
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              ¡Lleva tu inglés al siguiente nivel con Venglish!
            </Typography>
          </Box>
        </Grid>

        {/* LADO DERECHO: FORMULARIO (Limpio) */}
        <Grid 
          item xs={12} md={6} 
          sx={{ 
            p: { xs: 4, md: 8 }, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center",
            backgroundColor: "white" 
          }}
        >
          <Box width="100%">
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <Box
                sx={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  display: "flex", justifyContent: "center", alignItems: "center",
                  backgroundColor: "rgba(255, 75, 176, 0.1)",
                  border: "2px solid var(--venglish-pink)"
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 50, color: "var(--venglish-pink)" }} />
              </Box>

              {/* Cambiamos color="white" por "textPrimary" para que se vea en el fondo claro */}
              <Typography color="textPrimary" fontWeight="bold" variant="h5" sx={{ mt: 3 }}>
                Bienvenido a Venglish
              </Typography>
              <Typography color="textSecondary">
                Inicia sesión para continuar
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <input
                  type="text"
                  placeholder="Código de Estudiante"
                  className="custom-mui-input" // Estilo del index.css
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="custom-mui-input" // Estilo del index.css
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <Checkbox
                      sx={{ color: "var(--venglish-pink)", "&.Mui-checked": { color: "var(--venglish-pink)" } }}
                    />
                    <Typography variant="body2" color="textSecondary">Recuérdame</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "var(--venglish-pink)", cursor: "pointer" }}>
                    ¿Olvidaste tu contraseña?
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2, py: 1.5, borderRadius: "12px",
                    backgroundColor: "var(--venglish-pink)",
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: "#e03a9d" },
                  }}
                >
                  Entrar
                </Button>
              </Box>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}