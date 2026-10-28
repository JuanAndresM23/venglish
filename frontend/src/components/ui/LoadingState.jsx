import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingState({ message = "Cargando...", minHeight = "50vh" }) {
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress sx={{ color: "var(--venglish-pink)" }} />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
