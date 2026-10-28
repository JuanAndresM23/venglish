import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";

import { addTeacher, listTeachers } from "../../api/admin";
import TeacherFormDialog from "../../components/teachers/TeacherFormDialog";
import DataCard from "../../components/ui/DataCard";
import GradientButton from "../../components/ui/GradientButton";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import useIsMobile from "../../hooks/useIsMobile";
import { alertError, alertSuccess } from "../../utils/alerts";

const headCell = { fontWeight: 700, color: "var(--venglish-black)", background: "#fff5fa" };
const usernameChipSx = {
  fontWeight: 700,
  color: "var(--venglish-pink)",
  borderColor: "var(--venglish-pink)",
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const loadTeachers = useCallback(async () => {
    try {
      const data = await listTeachers();
      setTeachers(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("No se pudo cargar la lista. Intenta recargar la página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((t) =>
      [t.name, t.username, t.email].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [teachers, search]);

  const handleSave = async (form) => {
    try {
      await addTeacher(form);
      setCreating(false);
      loadTeachers();
    } catch (err) {
      alertError("No se pudo guardar", err.message || "Error al crear el docente.");
      throw err;
    }

    alertSuccess(
      "Docente creado",
      `${form.full_name} ya puede ingresar con el usuario ${form.username}. Recuerda configurar su horario.`
    );
  };

  const emptyMessage = loading ? "Cargando docentes..." : "No se encontraron docentes.";

  return (
    <PageContainer>
      <PageHeader
        icon={SchoolIcon}
        title="Docentes"
        subtitle={`${teachers.length} docentes registrados`}
        actions={
          <GradientButton startIcon={<PersonAddIcon />} onClick={() => setCreating(true)}>
            Nuevo docente
          </GradientButton>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <SurfaceCard sx={{ p: { xs: 1.5, md: 3 } }}>
        <TextField
          placeholder="Buscar docente..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        {isMobile ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {filtered.length > 0 ? (
              filtered.map((teacher) => (
                <DataCard
                  key={teacher.id}
                  title={teacher.name}
                  badges={[
                    <Chip
                      key="username"
                      label={teacher.username}
                      size="small"
                      variant="outlined"
                      sx={usernameChipSx}
                    />,
                  ]}
                  fields={[{ label: "Email", value: teacher.email }]}
                />
              ))
            ) : (
              <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                {emptyMessage}
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table aria-label="tabla de docentes">
              <TableHead>
                <TableRow>
                  <TableCell sx={headCell}>Nombre</TableCell>
                  <TableCell sx={headCell}>Usuario</TableCell>
                  <TableCell sx={headCell}>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((teacher) => (
                    <TableRow key={teacher.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{teacher.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={teacher.username}
                          size="small"
                          variant="outlined"
                          sx={usernameChipSx}
                        />
                      </TableCell>
                      <TableCell>{teacher.email}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SurfaceCard>

      <TeacherFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={handleSave}
      />
    </PageContainer>
  );
}
