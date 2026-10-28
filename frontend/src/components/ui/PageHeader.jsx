import { Box, Typography } from "@mui/material";

// Título de página con degradado de marca, subtítulo opcional y espacio para acciones (botones).
export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {Icon && (
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: "var(--venglish-gradient-strong)",
              boxShadow: "0 8px 20px rgba(255, 75, 176, 0.3)",
              flexShrink: 0,
            }}
          >
            <Icon />
          </Box>
        )}
        <Box>
          <Typography className="gradient-title" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: "var(--venglish-gray)", mt: 0.5 }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>{actions}</Box>}
    </Box>
  );
}
