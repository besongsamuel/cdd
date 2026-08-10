import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
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
import cddLogoIcon from "../../assets/cddLogoIcon.png";
import { useAuth } from "../../hooks/useAuth";
import { NotificationBell } from "../common/NotificationBell";
import { useBoardNotifications } from "../../hooks/useBoardNotifications";
import { LanguageSwitcher } from "../LanguageSwitcher";

type NavItem = { label: string; path: string };
type MenuKey = "about" | "activities" | "getInvolved";

const navButtonSx = (active: boolean) => ({
  color: active ? "primary.main" : "text.primary",
  fontSize: "15px",
  fontWeight: active ? 600 : 500,
  px: 1.5,
  py: 1,
  borderRadius: 0,
  minHeight: 48,
  whiteSpace: "nowrap" as const,
  position: "relative" as const,
  textTransform: "none" as const,
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: "56%",
    height: "2px",
    borderRadius: "2px 2px 0 0",
    background: "linear-gradient(90deg, #005078 0%, #0077a8 100%)",
    transform: active
      ? "translateX(-50%) scaleX(1)"
      : "translateX(-50%) scaleX(0)",
    transformOrigin: "center",
    transition: "transform 0.2s ease",
  },
  "&:hover": {
    backgroundColor: "transparent",
    color: "primary.main",
    "&::after": {
      transform: "translateX(-50%) scaleX(1)",
    },
  },
});

const utilityLinkSx = {
  color: "text.secondary",
  fontSize: "13px",
  fontWeight: 500,
  px: 1.25,
  py: 0.75,
  minWidth: 0,
  minHeight: 32,
  height: 32,
  textTransform: "none" as const,
  whiteSpace: "nowrap" as const,
  lineHeight: 1,
  "&:hover": {
    backgroundColor: "transparent",
    color: "primary.main",
  },
};

export const Header = () => {
  const location = useLocation();
  const { user, currentMember, isAdmin, signOut } = useAuth();
  useBoardNotifications();
  const { t } = useTranslation("navigation");
  const { t: tCommon } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navGroups = {
    about: [
      { label: t("services"), path: "/services" },
      { label: t("ourMembers"), path: "/members" },
      { label: t("departments"), path: "/departments" },
      { label: t("ministries"), path: "/ministries" },
    ],
    activities: [
      { label: t("eventsPrograms"), path: "/events" },
      { label: t("gallery"), path: "/gallery" },
      { label: t("sermons"), path: "/sermons" },
      { label: t("messageBoards"), path: "/message-boards" },
    ],
    getInvolved: [
      { label: t("donations"), path: "/donations" },
      { label: t("requests"), path: "/requests" },
      { label: t("suggestions"), path: "/suggestions" },
      { label: t("financialTransparency"), path: "/financial-transparency" },
    ],
  };

  const dropdownMenus: { key: MenuKey; label: string; items: NavItem[] }[] = [
    { key: "about", label: t("about"), items: navGroups.about },
    { key: "activities", label: t("activities"), items: navGroups.activities },
    {
      key: "getInvolved",
      label: t("getInvolved"),
      items: navGroups.getInvolved,
    },
  ];

  const isPathActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isGroupActive = (items: NavItem[]) =>
    items.some((item) => isPathActive(item.path));

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const handleDropdownOpen =
    (key: MenuKey) => (event: React.MouseEvent<HTMLElement>) => {
      setOpenMenu(key);
      setMenuAnchor(event.currentTarget);
    };

  const handleDropdownClose = () => {
    setOpenMenu(null);
    setMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleSignOut = async () => {
    await signOut();
    handleUserMenuClose();
  };

  const brand = (
    <Box
      component={Link}
      to="/"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        textDecoration: "none",
        color: "inherit",
        flexShrink: 0,
        transition: "opacity 0.2s ease",
        "&:hover": { opacity: 0.85 },
      }}
    >
      <Box
        component="img"
        src={cddLogoIcon}
        alt={tCommon("appName")}
        sx={{
          height: { xs: 28, md: 34 },
          width: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
      <Typography
        component="div"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "10px", md: "11px" },
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          textAlign: "center",
          whiteSpace: "nowrap",
          background: "linear-gradient(135deg, #005078 0%, #0077a8 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {tCommon("appName")}
      </Typography>
    </Box>
  );

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center", pt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>{brand}</Box>
      <Divider sx={{ mb: 1 }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/"
            selected={isPathActive("/")}
            sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={t("home")}
              primaryTypographyProps={{
                fontSize: "16px",
                fontWeight: isPathActive("/") ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/contact"
            selected={isPathActive("/contact")}
            sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={t("contactUs")}
              primaryTypographyProps={{
                fontSize: "16px",
                fontWeight: isPathActive("/contact") ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>

        {dropdownMenus.map((group) => (
          <Box key={group.key}>
            <ListItem disablePadding>
              <ListItemText
                primary={group.label}
                primaryTypographyProps={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "text.secondary",
                  px: 2,
                  pt: 2,
                  pb: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              />
            </ListItem>
            {group.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isPathActive(item.path)}
                  sx={{ borderRadius: 2, mx: 1, mb: 0.5, pl: 3 }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "15px",
                      fontWeight: isPathActive(item.path) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </Box>
        ))}

        {!user && (
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton component={Link} to="/login">
              <ListItemText
                primary={tCommon("login")}
                primaryTypographyProps={{
                  fontSize: "15px",
                  color: "text.secondary",
                }}
              />
            </ListItemButton>
          </ListItem>
        )}

        {user && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/profile/complete">
                <ListItemText
                  primary={tCommon("profile")}
                  primaryTypographyProps={{ fontSize: "16px" }}
                />
              </ListItemButton>
            </ListItem>
            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/admin/dashboard">
                  <ListItemText
                    primary={t("admin")}
                    primaryTypographyProps={{ fontSize: "16px" }}
                  />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={handleSignOut}>
                <ListItemText
                  primary={tCommon("logout")}
                  primaryTypographyProps={{ fontSize: "16px" }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  const activeDropdownItems =
    openMenu != null
      ? dropdownMenus.find((menu) => menu.key === openMenu)?.items ?? []
      : [];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: scrolled
            ? "rgba(255, 255, 255, 0.97)"
            : "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          color: "text.primary",
          transition: "all 0.3s ease",
          opacity: mounted ? 1 : 0,
          boxShadow: scrolled ? "0 2px 16px rgba(0, 0, 0, 0.06)" : "none",
        }}
      >
        {/* Utility bar — contact & account tools */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            backgroundColor: "rgba(245, 247, 250, 0.9)",
          }}
        >
          <Container maxWidth="lg" disableGutters sx={{ px: { md: 3, lg: 4 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0.75,
                minHeight: 40,
                py: 0.5,
                "& .MuiButton-root": {
                  display: "inline-flex",
                  alignItems: "center",
                  lineHeight: 1.2,
                },
                "& .MuiIconButton-root": {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  p: 0.5,
                },
              }}
            >
              <Button
                component={Link}
                to="/contact"
                sx={{
                  ...utilityLinkSx,
                  color: isPathActive("/contact")
                    ? "primary.main"
                    : "text.secondary",
                  fontWeight: isPathActive("/contact") ? 600 : 500,
                }}
              >
                {t("contactUs")}
              </Button>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

              {isAdmin && (
                <Button
                  component={Link}
                  to="/admin/dashboard"
                  sx={utilityLinkSx}
                >
                  {t("admin")}
                </Button>
              )}

              {user ? (
                <>
                  <NotificationBell />
                  <IconButton
                    onClick={handleUserMenuOpen}
                    size="small"
                    sx={{ ml: 0.25 }}
                    aria-label={tCommon("profile")}
                  >
                    <Avatar
                      src={currentMember?.picture_url}
                      alt={currentMember?.name || user.email || "User"}
                      sx={{ width: 28, height: 28, fontSize: 13 }}
                    >
                      {(
                        currentMember?.name ||
                        user.email ||
                        "U"
                      )[0].toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <MenuItem
                      component={Link}
                      to="/profile/complete"
                      onClick={handleUserMenuClose}
                    >
                      {tCommon("profile")}
                    </MenuItem>
                    <MenuItem onClick={handleSignOut}>
                      {tCommon("logout")}
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button component={Link} to="/login" sx={utilityLinkSx}>
                  {tCommon("login")}
                </Button>
              )}

              <LanguageSwitcher compact />
            </Box>
          </Container>
        </Box>

        {/* Primary navigation */}
        <Toolbar
          sx={{
            px: { xs: 2, md: 3, lg: 4 },
            minHeight: { xs: 64, md: 72 },
            gap: 2,
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              display: { md: "none" },
              mr: 0.5,
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <MenuIcon />
          </IconButton>

          {brand}

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop primary nav */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "stretch",
              gap: 0.25,
            }}
          >
            <Button
              component={Link}
              to="/"
              sx={navButtonSx(isPathActive("/"))}
            >
              {t("home")}
            </Button>

            {dropdownMenus.map((menu) => {
              const active = isGroupActive(menu.items);
              const isOpen = openMenu === menu.key;
              return (
                <Button
                  key={menu.key}
                  onClick={handleDropdownOpen(menu.key)}
                  endIcon={
                    <ArrowDropDownIcon
                      sx={{
                        fontSize: 18,
                        ml: -0.5,
                        transition: "transform 0.2s ease",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    />
                  }
                  sx={navButtonSx(active || isOpen)}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                >
                  {menu.label}
                </Button>
              );
            })}
          </Box>

          {/* Mobile utility cluster */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 0.5,
              ml: "auto",
            }}
          >
            {user && <NotificationBell />}
            <LanguageSwitcher compact />
          </Box>
        </Toolbar>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor) && openMenu != null}
          onClose={handleDropdownClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.5,
                minWidth: 220,
                borderRadius: 2,
                boxShadow: "0 8px 28px rgba(0, 0, 0, 0.12)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              },
            },
          }}
        >
          {activeDropdownItems.map((item) => (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleDropdownClose}
              selected={isPathActive(item.path)}
              sx={{
                py: 1.25,
                px: 2,
                fontSize: 14,
                fontWeight: isPathActive(item.path) ? 600 : 400,
                color: isPathActive(item.path)
                  ? "primary.main"
                  : "text.primary",
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 300,
            pt: 1,
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
