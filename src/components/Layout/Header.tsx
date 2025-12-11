import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { CHURCH_LOGO_URL } from '../../utils/constants';
import { LanguageSwitcher } from '../LanguageSwitcher';

export const Header = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useTranslation('navigation');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: t('home'), path: '/' },
    { label: t('ourMembers'), path: '/members' },
    { label: t('eventsPrograms'), path: '/events' },
    { label: t('gallery'), path: '/gallery' },
    { label: t('requests'), path: '/requests' },
    { label: t('contactUs'), path: '/contact' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', pt: 2 }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '17px',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/admin/dashboard">
              <ListItemText
                primary={t('admin')}
                primaryTypographyProps={{ fontSize: '17px' }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 4,
            }}
          >
            <Box
              component="img"
              src={CHURCH_LOGO_URL}
              alt="City of David Logo"
              sx={{
                height: 32,
                mr: 1.5,
                objectFit: 'contain',
                display: { xs: 'none', sm: 'block' },
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: '17px',
                letterSpacing: '-0.01em',
              }}
            >
              {t('appName', { ns: 'common' })}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: 'text.primary',
                  fontSize: '17px',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </Button>
            ))}
            {isAdmin && (
              <Button
                component={Link}
                to="/admin/dashboard"
                sx={{
                  color: 'text.primary',
                  fontSize: '17px',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {t('admin')}
              </Button>
            )}
            <LanguageSwitcher />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            pt: 2,
          },
        }}
      >
        {drawer}
        <Box sx={{ px: 2, py: 2 }}>
          <LanguageSwitcher />
        </Box>
      </Drawer>
    </>
  );
};
