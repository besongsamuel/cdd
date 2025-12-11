import { Box, Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';

export const LanguageSwitcher = () => {
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
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  const currentLang = i18n.language || 'en';
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        sx={{
          color: 'text.primary',
          fontSize: '17px',
          px: 2.5,
          py: 1.2,
          borderRadius: 2,
          minWidth: 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(30, 58, 138, 0.06)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {languages.find((l) => l.code === currentLang)?.label || 'EN'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={currentLang === lang.code}
            sx={{
              fontSize: '17px',
              minHeight: '44px',
              borderRadius: 1,
              mx: 0.5,
              my: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(30, 58, 138, 0.08)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(30, 58, 138, 0.12)',
                color: 'primary.main',
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

