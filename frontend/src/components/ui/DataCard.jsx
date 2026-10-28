import { Box, Typography } from "@mui/material";

// Fila de datos pensada para móvil (sustituye a una fila de tabla): título, datos en pares
// etiqueta/valor y una zona de acciones al pie. `badges` admite chips junto al título.
export default function DataCard({ title, badges, fields = [], actions }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "16px",
        border: "1px solid rgba(255, 75, 176, 0.18)",
        background: "#fff",
        boxShadow: "0 6px 18px rgba(255, 75, 176, 0.08)",
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Typography fontWeight={800} sx={{ wordBreak: "break-word" }}>
          {title}
        </Typography>
        {badges && <Box display="flex" gap={0.75} flexWrap="wrap">{badges}</Box>}
      </Box>

      <Box
        component="dl"
        sx={{ m: 0, mt: 1.5, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px" }}
      >
        {fields
          .filter((field) => field.value)
          .map((field) => (
            <Box key={field.label} sx={{ display: "contents" }}>
              <Typography
                component="dt"
                variant="body2"
                sx={{ color: "var(--venglish-light-gray)", fontWeight: 600 }}
              >
                {field.label}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0, wordBreak: "break-word" }}>
                {field.value}
              </Typography>
            </Box>
          ))}
      </Box>

      {actions && (
        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
          {actions}
        </Box>
      )}
    </Box>
  );
}
