import { Paper } from "@mui/material";

// Tarjeta blanca de bordes redondeados usada para formularios, tablas y paneles.
export default function SurfaceCard({ children, sx, ...props }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: "22px",
        backgroundColor: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(255, 75, 176, 0.12)",
        boxShadow: "0 14px 40px rgba(255, 75, 176, 0.1)",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}
