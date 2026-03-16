import React, { useState } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import "../components/StudentLogin.css"; // Reutilizamos tus estilos de inputs

export default function StudentRegister() {
  const [formData, setFormData] = useState({ 
    student_code: "",
    password: ""
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/api/student_register", {
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
        
        {/* LADO IZQUIERDO: DECORATIVO (TitleBox) */}
        <Grid 
          item 
          xs={0} md={6} 
          sx={{ 
            display: { xs: "none", md: "flex" },
            background: "linear-gradient(135deg, #ff61d2 0%, #ffde59 100%)",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
            textAlign: "left"
          }}
        >
          <Box>
            <Typography variant="h3" fontWeight="bold" color="white" mb={2} sx={{ lineHeight: 1.2 }}>
              ¡Activa tu <br /> Cuenta!
            </Typography>
            <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
              Usa el código que te entregó 
              Victoria para completar tu perfil.
            </Typography>
          </Box>
        </Grid>

        {/* LADO DERECHO: FORMULARIO */}
        <Grid 
          item 
          xs={12} md={6} 
          sx={{ 
            p: { xs: 4, md: 6 }, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center" 
          }}
        >
          <Box width="100%">
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Box
                sx={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  boxShadow: `0 0 20px rgba(255, 75, 176, 0.4)`,
                }}
              >
                <AssignmentIndIcon sx={{ fontSize: 40, color: "white" }} />
              </Box>

              <Typography color="white" fontWeight="bold" variant="h5" sx={{ mt: 2 }}>
                Crea tu perfil
              </Typography>
            </Box>

            <form onSubmit={handleRegister}>
  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
    <Typography variant="body2" color="white" sx={{ mb: 1, opacity: 0.9 }}>
      Ingresa el código y contraseña
    </Typography>

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

    <Button
      type="submit"
      variant="contained"
      fullWidth
      sx={{
        mt: 2,
        py: 2,
        borderRadius: "12px",
        backgroundColor: "#ff4bb0",
        fontWeight: "bold",
        "&:hover": { backgroundColor: "#e03a9d" },
      }}
    >
      Activar mi cuenta
    </Button>
  </Box>
</form>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}