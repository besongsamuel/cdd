import HomeIcon from "@mui/icons-material/Home";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const drawerWidth = 240;

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Members", path: "/admin/members" },
    { label: "Events & Programs", path: "/admin/events" },
    { label: "Departments", path: "/admin/departments" },
    { label: "Ministries", path: "/admin/ministries" },
    { label: "Message Boards", path: "/admin/message-boards" },
    { label: "Gallery", path: "/admin/gallery" },
    { label: "Donations", path: "/admin/donations" },
    { label: "Requests", path: "/admin/requests" },
    { label: "Suggestions", path: "/admin/suggestions" },
    { label: "Titles", path: "/admin/titles" },
    { label: "Contact Submissions", path: "/admin/contact" },
    { label: "Test Emails", path: "/admin/email-test" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            Back to Website
          </Button>
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
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
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
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
