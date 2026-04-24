import React, { useState } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import "../css/index.css";
import API_URL from "../config"; // ← AGREGADO

export default function StudentRegister() {
  const [formData, setFormData] = useState({ 
    student_code: "",
    password: "",
    confirmPassword: "" // ← AGREGADO
  });
  const [error, setError] = useState("");     // ← AGREGADO
  const [success, setSuccess] = useState(""); // ← AGREGADO
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ← AGREGADO: Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/student_register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_code: formData.student_code,
          password: formData.password
        })
      });

      if (res.ok) {
        setSuccess("¡Cuenta activada con éxito! Redirigiendo..."); // ← CAMBIADO
        setTimeout(() => navigate("/login"), 2000); // ← Redirige después de 2 segundos
      } else {
        const data = await res.json();
        setError(data.error || "Error al registrarse. Verifica tu código."); // ← CAMBIADO
      }
    } catch (error) {
      setError("No se pudo conectar con el servidor. Intenta de nuevo."); // ← CAMBIADO
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--venglish-bg-gradient)",
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
        
        {/* LADO IZQUIERDO */}
        <Grid 
          item xs={0} md={6} 
          sx={{ 
            display: { xs: "none", md: "flex" },
            background: "var(--venglish-gradient)",
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

        {/* LADO DERECHO: FORMULARIO */}
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
                  className="custom-mui-input"
                  onChange={e => setFormData({...formData, student_code: e.target.value})}
                  required
                />
                
                <input
                  type="password"
                  placeholder="Crea tu nueva Contraseña"
                  className="custom-mui-input"
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />

                {/* ← AGREGADO: Campo confirmar contraseña */}
                <input
                  type="password"
                  placeholder="Confirma tu Contraseña"
                  className="custom-mui-input"
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />

                {/* ← AGREGADO: Mensaje de error */}
                {error && (
                  <Typography
                    variant="body2"
                    textAlign="center"
                    sx={{
                      color: "white",
                      backgroundColor: "#e53935",
                      borderRadius: "8px",
                      padding: "10px"
                    }}
                  >
                    ⚠️ {error}
                  </Typography>
                )}

                {/* ← AGREGADO: Mensaje de éxito */}
                {success && (
                  <Typography
                    variant="body2"
                    textAlign="center"
                    sx={{
                      color: "white",
                      backgroundColor: "#43a047",
                      borderRadius: "8px",
                      padding: "10px"
                    }}
                  >
                    ✅ {success}
                  </Typography>
                )}

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