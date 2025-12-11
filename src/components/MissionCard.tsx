import { Box, Card, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface MissionCardProps {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
}

export const MissionCard = ({
  number,
  title,
  description,
  icon,
}: MissionCardProps) => {
  return (
    <Card
      sx={{
        height: "100%",
        textAlign: "center",
        p: { xs: 3, sm: 4 },
        bgcolor: "background.paper",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: { xs: "none", sm: "translateY(-4px)" },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: 3,
          "& svg": {
            fontSize: 48,
            color: "primary.main",
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h3"
        component="div"
        sx={{
          fontSize: { xs: "48px", md: "56px" },
          fontWeight: 600,
          color: "primary.main",
          mb: 2,
          opacity: 0.15,
          lineHeight: 1,
        }}
      >
        {number}
      </Typography>
      <Typography
        variant="h5"
        component="h3"
        sx={{
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: "22px", md: "24px" },
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          fontSize: "17px",
          lineHeight: 1.6,
          textAlign: "left",
        }}
      >
        {description}
      </Typography>
    </Card>
  );
};
