import React, { useState } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import "../index.css"; // Llamamos al nuevo estilo global

export default function StudentRegister() {
  const [formData, setFormData] = useState({ 
    student_code: "",
    password: ""
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Cambiado a localhost para consistencia
      const res = await fetch("http://localhost:5000/api/student_register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("¡Cuenta activada con éxito! Ahora puedes iniciar sesión.");
        navigate("/login");
      } else {
        const data = await res.json();
        alert(data.error || "Error al registrarse. Verifica tu código.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
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
        background: "var(--venglish-bg-gradient)", // Fondo nuevo
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
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        
        {/* LADO IZQUIERDO: DECORATIVO (Rosa Vibrante) */}
        <Grid 
          item xs={0} md={6} 
          sx={{ 
            display: { xs: "none", md: "flex" },
            background: "var(--venglish-gradient)", // Gradiente de marca
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <Box sx={{ color: "white", textAlign: "center" }}>
            <Typography variant="h3" fontWeight="bold" mb={2} sx={{ lineHeight: 1.2 }}>
              ¡Activa tu <br /> Cuenta!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Usa el código que te entregó Victoria
            </Typography>
          </Box>
        </Grid>

        {/* LADO DERECHO: FORMULARIO (Limpio y Blanco) */}
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
                  border: "2px solid var(--venglish-pink)",
                  mb: 2
                }}
              >
                <AssignmentIndIcon sx={{ fontSize: 50, color: "var(--venglish-pink)" }} />
              </Box>

              {/* Texto oscuro para contraste */}
              <Typography color="textPrimary" fontWeight="bold" variant="h5">
                Crea tu perfil
              </Typography>
              <Typography color="textSecondary" variant="body2" sx={{ textAlign: "center", mt: 1 }}>
                Ingresa tus credenciales para comenzar
              </Typography>
            </Box>

            <form onSubmit={handleRegister}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <input
                  type="text"
                  placeholder="Tu Código de Estudiante"
                  className="custom-mui-input" // Estilo del index.css
                  onChange={e => setFormData({...formData, student_code: e.target.value})}
                  required
                />
                
                <input
                  type="password"
                  placeholder="Crea tu nueva Contraseña"
                  className="custom-mui-input" // Estilo del index.css
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.8,
                    borderRadius: "12px",
                    background: "var(--venglish-gradient)",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    textTransform: "none",
                    boxShadow: "0 10px 20px rgba(255, 75, 176, 0.3)",
                    "&:hover": { opacity: 0.9 },
                  }}
                >
                  Activar mi cuenta
                </Button>
                
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  align="center" 
                  sx={{ mt: 2, cursor: "pointer", "&:hover": { color: "var(--venglish-pink)" } }}
                  onClick={() => navigate("/login")}
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </Typography>
              </Box>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}