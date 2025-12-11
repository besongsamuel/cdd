import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemText, Button } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 240;

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Members', path: '/admin/members' },
    { label: 'Events', path: '/admin/events' },
    { label: 'Requests', path: '/admin/requests' },
    { label: 'Contact Submissions', path: '/admin/contact' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};


