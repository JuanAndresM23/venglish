import React, { useState } from "react";
import { Box, Button, Checkbox, Typography, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import "../components/StudentLogin.css";

export default function StudentLogin({ setUser }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("student_code", code);
    formData.append("password", password);

    const res = await fetch("http://127.0.0.1:5000/student_login", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const userRes = await fetch("http://127.0.0.1:5000/api/me", {
        credentials: "include",
      });
      const userData = await userRes.json();
      setUser(userData);
      navigate("/dashboard");
    } else {
      alert("Código o contraseña incorrectos");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)",
        p: 2,
      }}
    >
      {/* Contenedor Principal con bordes redondeados y sombra */}
      <Grid 
        container 
        sx={{ 
          maxWidth: "1000px", 
          width: "100%", 
          borderRadius: "30px", 
          overflow: "hidden", 
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        
        {/* LADO IZQUIERDO: TITLEBOX (Solo visible en tablets/PC) */}
        <Grid 
          item 
          xs={0} md={6} 
          sx={{ 
            display: { xs: "none", md: "flex" },
            background: "linear-gradient(135deg, #ff61d2 0%, #ffde59 100%)", // Colores de tu logo
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
            textAlign: "left"
          }}
        >
          <Box>
            <Typography variant="h3" fontWeight="bold" color="white" mb={2} sx={{ lineHeight: 1.2 }}>
              Únete a nuestra <br /> Comunidad
            </Typography>
            <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
              ¡Lleva tu inglés al siguiente nivel con Venglish!
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
                  overflow: "hidden",
                  boxShadow: `0 0 20px rgba(255, 75, 176, 0.5)`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)"
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 60, color: "white" }} />
              </Box>

              <Typography color="white" fontWeight="bold" variant="h5" sx={{ mt: 3, textAlign: "center" }}>
                Bienvenido a Venglish
              </Typography>
              <Typography color="white" sx={{ opacity: 0.8, textAlign: "center" }}>
                Inicia sesión para continuar aprendiendo
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <input
                  type="text"
                  placeholder="Código de Estudiante"
                  className="custom-mui-input"
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="custom-mui-input"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Box display="flex" justifyContent="space-between" alignItems="center" color="white">
                  <Box display="flex" alignItems="center">
                    <Checkbox
                      disableRipple
                      sx={{ p: 0, pr: 1, color: "white", "&.Mui-checked": { color: "white" } }}
                    />
                    <Typography variant="body2">Recuérdame</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ cursor: "pointer", textDecoration: "underline" }}>
                    ¿Olvidaste tu contraseña?
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: "12px",
                    backgroundColor: "#ff4bb0",
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: "#e03a9d" },
                    boxShadow: `0 4px 15px rgba(255, 75, 176, 0.4)`,
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