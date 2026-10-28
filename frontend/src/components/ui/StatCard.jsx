import { Box, Paper, Typography } from "@mui/material";

// Tarjeta de indicador (número grande + icono) con fondo en degradado.
export default function StatCard({ title, value, icon, background }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minHeight: { xs: 0, sm: 120 },
        p: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1.5, sm: 2.5 },
        borderRadius: "22px",
        color: "#fff",
        background,
        boxShadow: "0 14px 35px rgba(0, 0, 0, 0.12)",
        transition: "0.25s ease",
        "&:hover": { transform: "translateY(-4px)" },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "18px",
          display: "grid",
          placeItems: "center",
          backgroundColor: "rgba(255,255,255,0.22)",
          "& svg": { fontSize: 32 },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
          {value ?? 0}
        </Typography>
      </Box>
    </Paper>
  );
}
