import { Box } from "@mui/material";

// Contenedor estándar de una página: centrado, con ancho máximo y espaciado uniforme.
export default function PageContainer({ maxWidth = 1100, children, sx }) {
  return (
    <Box sx={{ width: "100%", maxWidth, mx: "auto", ...sx }}>{children}</Box>
  );
}
