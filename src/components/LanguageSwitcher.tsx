import LanguageIcon from "@mui/icons-material/Language";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type LanguageSwitcherProps = {
  compact?: boolean;
};

export const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    handleClose();
    document.documentElement.lang = lang;
  };

  const currentLang = (i18n.language || "en").split("-")[0];
  const languages = [
    { code: "en", label: "English", short: "EN" },
    { code: "fr", label: "Français", short: "FR" },
  ];
  const current = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon sx={{ fontSize: compact ? 16 : 20 }} />}
        sx={
          compact
            ? {
                color: "text.secondary",
                fontSize: "12px",
                fontWeight: 600,
                px: 1,
                py: 0,
                minWidth: 0,
                minHeight: 32,
                height: 32,
                borderRadius: 1,
                textTransform: "none",
                letterSpacing: "0.02em",
                lineHeight: 1,
                "& .MuiButton-startIcon": {
                  mr: 0.5,
                  ml: 0,
                  display: "inline-flex",
                  alignItems: "center",
                },
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "primary.main",
                },
              }
            : {
                color: "text.primary",
                fontSize: { xs: "16px", sm: "17px" },
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 2,
                minWidth: { xs: "44px", sm: "auto" },
                minHeight: "44px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }
        }
      >
        {compact ? current.short : current.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === currentLang}
            sx={{
              fontSize: "15px",
              minHeight: "44px",
              borderRadius: 1,
              mx: 0.5,
              my: 0.5,
              "&.Mui-selected": {
                backgroundColor: "rgba(0, 80, 120, 0.1)",
                color: "primary.main",
                fontWeight: 600,
              },
            }}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
