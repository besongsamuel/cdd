import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LanguageSwitcher } from "../LanguageSwitcher";

export const Header = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useTranslation("navigation");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [aboutAnchor, setAboutAnchor] = useState<null | HTMLElement>(null);
  const [activitiesAnchor, setActivitiesAnchor] = useState<null | HTMLElement>(
    null
  );
  const [getInvolvedAnchor, setGetInvolvedAnchor] =
    useState<null | HTMLElement>(null);

  const navGroups = {
    standalone: [
      { label: t("home"), path: "/" },
      { label: t("contactUs"), path: "/contact" },
    ],
    about: [
      { label: t("services"), path: "/services" },
      { label: t("ourMembers"), path: "/members" },
      { label: t("departments"), path: "/departments" },
      { label: t("ministries"), path: "/ministries" },
    ],
    activities: [
      { label: t("eventsPrograms"), path: "/events" },
      { label: t("gallery"), path: "/gallery" },
    ],
    getInvolved: [
      { label: t("donations"), path: "/donations" },
      { label: t("requests"), path: "/requests" },
      { label: t("suggestions"), path: "/suggestions" },
      { label: t("financialTransparency"), path: "/financial-transparency" },
    ],
  };

  const handleMenuOpen =
    (menu: "about" | "activities" | "getInvolved") =>
    (event: React.MouseEvent<HTMLElement>) => {
      if (menu === "about") setAboutAnchor(event.currentTarget);
      if (menu === "activities") setActivitiesAnchor(event.currentTarget);
      if (menu === "getInvolved") setGetInvolvedAnchor(event.currentTarget);
    };

  const handleMenuClose =
    (menu: "about" | "activities" | "getInvolved") => () => {
      if (menu === "about") setAboutAnchor(null);
      if (menu === "activities") setActivitiesAnchor(null);
      if (menu === "getInvolved") setGetInvolvedAnchor(null);
    };

  const isPathActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isGroupActive = (items: typeof navGroups.about) => {
    return items.some((item) => isPathActive(item.path));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center", pt: 2 }}>
      <List>
        {navGroups.standalone.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isPathActive(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&.Mui-selected": {
                  backgroundColor: "rgba(30, 58, 138, 0.08)",
                  color: "primary.main",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "60%",
                    background:
                      "linear-gradient(180deg, #1e3a8a 0%, #2563eb 100%)",
                    borderRadius: "0 2px 2px 0",
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "17px",
                  fontWeight: isPathActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <ListItem disablePadding>
          <ListItemText
            primary={t("about")}
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: 600,
              color: "text.secondary",
              px: 2,
              pt: 2,
            }}
          />
        </ListItem>
        {navGroups.about.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isPathActive(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                pl: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&.Mui-selected": {
                  backgroundColor: "rgba(30, 58, 138, 0.08)",
                  color: "primary.main",
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "16px",
                  fontWeight: isPathActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <ListItem disablePadding>
          <ListItemText
            primary={t("activities")}
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: 600,
              color: "text.secondary",
              px: 2,
              pt: 2,
            }}
          />
        </ListItem>
        {navGroups.activities.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isPathActive(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                pl: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&.Mui-selected": {
                  backgroundColor: "rgba(30, 58, 138, 0.08)",
                  color: "primary.main",
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "16px",
                  fontWeight: isPathActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <ListItem disablePadding>
          <ListItemText
            primary={t("getInvolved")}
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: 600,
              color: "text.secondary",
              px: 2,
              pt: 2,
            }}
          />
        </ListItem>
        {navGroups.getInvolved.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isPathActive(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                pl: 3,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&.Mui-selected": {
                  backgroundColor: "rgba(30, 58, 138, 0.08)",
                  color: "primary.main",
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "16px",
                  fontWeight: isPathActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/admin/dashboard">
              <ListItemText
                primary={t("admin")}
                primaryTypographyProps={{ fontSize: "17px" }}
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
          backgroundColor: scrolled
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(0, 0, 0, 0.12)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          color: "text.primary",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-20px)",
          boxShadow: scrolled ? "0 2px 20px rgba(0, 0, 0, 0.08)" : "none",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: "none" },
              transition: "all 0.2s ease",
              minWidth: "44px",
              minHeight: "44px",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.06)",
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
              mr: { xs: 2, sm: 4 },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              minHeight: "44px",
              minWidth: "44px",
              "&:hover": {
                transform: "scale(1.02)",
                opacity: 0.8,
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "16px", sm: "18px" },
                letterSpacing: "-0.01em",
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                transition: "all 0.3s ease",
              }}
            >
              {t("appName", { ns: "common" })}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: 0.5,
              alignItems: "center",
            }}
          >
            {navGroups.standalone.map((item, index) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: "text.primary",
                  fontSize: { xs: "16px", sm: "17px" },
                  fontWeight: isPathActive(item.path) ? 600 : 400,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1, sm: 1.2 },
                  borderRadius: 2,
                  position: "relative",
                  overflow: "hidden",
                  minHeight: "44px",
                  minWidth: "44px",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    width: isPathActive(item.path) ? "80%" : "0%",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                    transform: "translateX(-50%)",
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  },
                  "&:hover::before": {
                    width: "80%",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(30, 58, 138, 0.06)",
                    transform: "translateY(-2px)",
                    color: isPathActive(item.path)
                      ? "primary.main"
                      : "text.primary",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: mounted ? 1 : 0,
                  animation: mounted
                    ? `fadeInUp 0.5s ease ${index * 0.05}s both`
                    : "none",
                  "@keyframes fadeInUp": {
                    from: {
                      opacity: 0,
                      transform: "translateY(10px)",
                    },
                    to: {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
                {item.label}
              </Button>
            ))}

            {/* About Dropdown */}
            <Button
              onClick={handleMenuOpen("about")}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                color: isGroupActive(navGroups.about)
                  ? "primary.main"
                  : "text.primary",
                fontSize: { xs: "16px", sm: "17px" },
                fontWeight: isGroupActive(navGroups.about) ? 600 : 400,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 2,
                position: "relative",
                minHeight: "44px",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  width: isGroupActive(navGroups.about) ? "80%" : "0%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  transform: "translateX(-50%)",
                  transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {t("about")}
            </Button>
            <Menu
              anchorEl={aboutAnchor}
              open={Boolean(aboutAnchor)}
              onClose={handleMenuClose("about")}
              MenuListProps={{
                "aria-labelledby": "about-button",
              }}
              sx={{ mt: 1 }}
            >
              {navGroups.about.map((item) => (
                <MenuItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={handleMenuClose("about")}
                  selected={isPathActive(item.path)}
                  sx={{
                    minWidth: 180,
                    color: isPathActive(item.path)
                      ? "primary.main"
                      : "text.primary",
                    fontWeight: isPathActive(item.path) ? 600 : 400,
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>

            {/* Activities Dropdown */}
            <Button
              onClick={handleMenuOpen("activities")}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                color: isGroupActive(navGroups.activities)
                  ? "primary.main"
                  : "text.primary",
                fontSize: { xs: "16px", sm: "17px" },
                fontWeight: isGroupActive(navGroups.activities) ? 600 : 400,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 2,
                position: "relative",
                minHeight: "44px",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  width: isGroupActive(navGroups.activities) ? "80%" : "0%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  transform: "translateX(-50%)",
                  transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {t("activities")}
            </Button>
            <Menu
              anchorEl={activitiesAnchor}
              open={Boolean(activitiesAnchor)}
              onClose={handleMenuClose("activities")}
              MenuListProps={{
                "aria-labelledby": "activities-button",
              }}
              sx={{ mt: 1 }}
            >
              {navGroups.activities.map((item) => (
                <MenuItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={handleMenuClose("activities")}
                  selected={isPathActive(item.path)}
                  sx={{
                    minWidth: 180,
                    color: isPathActive(item.path)
                      ? "primary.main"
                      : "text.primary",
                    fontWeight: isPathActive(item.path) ? 600 : 400,
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>

            {/* Get Involved Dropdown */}
            <Button
              onClick={handleMenuOpen("getInvolved")}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                color: isGroupActive(navGroups.getInvolved)
                  ? "primary.main"
                  : "text.primary",
                fontSize: { xs: "16px", sm: "17px" },
                fontWeight: isGroupActive(navGroups.getInvolved) ? 600 : 400,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 2,
                position: "relative",
                minHeight: "44px",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  width: isGroupActive(navGroups.getInvolved) ? "80%" : "0%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  transform: "translateX(-50%)",
                  transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                },
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.06)",
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {t("getInvolved")}
            </Button>
            <Menu
              anchorEl={getInvolvedAnchor}
              open={Boolean(getInvolvedAnchor)}
              onClose={handleMenuClose("getInvolved")}
              MenuListProps={{
                "aria-labelledby": "getInvolved-button",
              }}
              sx={{ mt: 1 }}
            >
              {navGroups.getInvolved.map((item) => (
                <MenuItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={handleMenuClose("getInvolved")}
                  selected={isPathActive(item.path)}
                  sx={{
                    minWidth: 180,
                    color: isPathActive(item.path)
                      ? "primary.main"
                      : "text.primary",
                    fontWeight: isPathActive(item.path) ? 600 : 400,
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
            {isAdmin && (
              <Button
                component={Link}
                to="/admin/dashboard"
                sx={{
                  color: "text.primary",
                  fontSize: { xs: "16px", sm: "17px" },
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1, sm: 1.2 },
                  borderRadius: 2,
                  minHeight: "44px",
                  minWidth: "44px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: "rgba(30, 58, 138, 0.06)",
                    transform: "translateY(-2px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                {t("admin")}
              </Button>
            )}
            <Box
              sx={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1)" : "scale(0.8)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
              }}
            >
              <LanguageSwitcher />
            </Box>
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
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            pt: 2,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        {drawer}
        <Box sx={{ px: 2, py: 2, borderTop: "1px solid rgba(0, 0, 0, 0.08)" }}>
          <LanguageSwitcher />
        </Box>
      </Drawer>
    </>
  );
};
