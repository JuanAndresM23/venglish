import React, { useEffect, useState } from "react";
import { 
  Container, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Button, Box, Chip, Alert
} from "@mui/material";
import { Link } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import API_URL from "../config"; // ← AGREGADO

export default function ListStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // ← AGREGADO

  useEffect(() => {
    fetch(`${API_URL}/api/list_students`, { 
      credentials: "include" 
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al cargar los estudiantes"); // ← AGREGADO
        return res.json();
      })
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        setError("No se pudo cargar la lista. Intenta recargar la página."); // ← CAMBIADO
        setLoading(false);
      });
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Directorio de Estudiantes
        </Typography>
        <Button 
          component={Link} 
          to="/dashboard" 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
        >
          Volver
        </Button>
      </Box>

      {/* ← AGREGADO: Mensaje de error visible */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          ⚠️ {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de estudiantes">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                    {student.name}
                  </TableCell>
                  <TableCell>
                    <Chip label={student.code} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{student.email}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  {loading ? "Cargando estudiantes..." : "No se encontraron estudiantes registrados."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}