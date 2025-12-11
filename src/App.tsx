import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { ContactSubmissionsManager } from "./components/Admin/ContactSubmissionsManager";
import { EventsManager } from "./components/Admin/EventsManager";
import { MembersManager } from "./components/Admin/MembersManager";
import { RequestsManager } from "./components/Admin/RequestsManager";
import { Footer } from "./components/Layout/Footer";
import { Header } from "./components/Layout/Header";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ContactPage } from "./pages/ContactPage";
import { EventsPage } from "./pages/EventsPage";
import { GalleryPage } from "./pages/GalleryPage";
import { LandingPage } from "./pages/LandingPage";
import { MembersPage } from "./pages/MembersPage";
import { RequestsPage } from "./pages/RequestsPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: "#1e3a8a", // Deep blue - adjust to match your logo
      light: "#3b82f6",
      dark: "#1e40af",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2563eb", // Bright blue accent
      light: "#60a5fa",
      dark: "#1d4ed8",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 980,
          padding: '8px 22px',
          fontSize: '17px',
          fontWeight: 400,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    <>
                      <Header />
                      <Box component="main" sx={{ flexGrow: 1 }}>
                        <LandingPage />
                      </Box>
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <>
                      <Header />
                      <Box component="main" sx={{ flexGrow: 1 }}>
                        <ContactPage />
                      </Box>
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/members"
                  element={
                    <>
                      <Header />
                      <Box component="main" sx={{ flexGrow: 1 }}>
                        <MembersPage />
                      </Box>
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <>
                      <Header />
                      <Box component="main" sx={{ flexGrow: 1 }}>
                        <EventsPage />
                      </Box>
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/gallery"
                  element={
                    <>
                      <Header />
                      <Box component="main" sx={{ flexGrow: 1 }}>
                        <GalleryPage />
                      </Box>
                      <Footer />
                    </>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <>
                      <Header />
                      <Box component="main" sx={{ flexGrow: 1 }}>
                        <RequestsPage />
                      </Box>
                      <Footer />
                    </>
                  }
                />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="members" element={<MembersManager />} />
                  <Route path="events" element={<EventsManager />} />
                  <Route path="requests" element={<RequestsManager />} />
                  <Route
                    path="contact"
                    element={<ContactSubmissionsManager />}
                  />
                  <Route
                    path=""
                    element={<Navigate to="/admin/dashboard" replace />}
                  />
                </Route>
              </Routes>
            </Box>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
