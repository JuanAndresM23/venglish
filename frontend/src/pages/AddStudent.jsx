import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import "../index.css";

export default function AddStudent() {
  const [formData, setFormData] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    student_code: "" // <-- El dato clave
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
   try {
    const res = await fetch("http://localhost:5000/api/add_student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      // CRÍTICO: Sin esto, @admin_required siempre dará 401
      credentials: "include" 
    });

    if (res.ok) {
      alert("Estudiante guardado");
      navigate("/dashboard");
    } else if (res.status === 401) {
      alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión como admin.");
      navigate("/admin-login");
    } else {
      const errorData = await res.json();
      alert(errorData.error || "Error al guardar");
    }
  } catch (error) {
    console.error("Error de red:", error);
  }
};

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      background: "var(--venglish-bg-gradient)", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      p: 3 
    }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: "20px", maxWidth: "450px", width: "100%" }}>
        <Box display="flex" alignItems="center" mb={3} gap={2}>
          <PersonAddIcon sx={{ color: "var(--venglish-pink)", fontSize: 35 }} />
          <Typography variant="h5" fontWeight="bold" color="textPrimary">
            Nuevo Estudiante
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Campo del Código (El más importante) */}
            <Typography variant="caption" color="var(--venglish-pink)" fontWeight="bold">
              ESTE CÓDIGO ES EL QUE USARÁ EL ALUMNO PARA ACTIVAR SU CUENTA
            </Typography>
            <input 
              type="text" 
              placeholder="Código único (Ej: VENG-001)" 
              className="custom-mui-input" 
              onChange={e => setFormData({...formData, student_code: e.target.value.toUpperCase()})} 
              required 
            />

            <input 
              type="text" 
              placeholder="Nombre Completo" 
              className="custom-mui-input" 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />

            <input 
              type="text" 
              placeholder="Teléfono" 
              className="custom-mui-input" 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
            />

            <input 
              type="email" 
              placeholder="Correo Electrónico" 
              className="custom-mui-input" 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={{ 
                mt: 2, 
                py: 1.5, 
                borderRadius: "12px", 
                background: "var(--venglish-gradient)",
                fontWeight: "bold"
              }}
            >
              Guardar y Generar Registro
            </Button>

            <Button 
              component={Link} 
              to="/dashboard" 
              fullWidth 
              sx={{ color: "textSecondary", textTransform: "none" }}
            >
              Cancelar y Volver
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}