import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { ContactSubmissionsManager } from "./components/Admin/ContactSubmissionsManager";
import { DepartmentsManager } from "./components/Admin/DepartmentsManager";
import { DonationsManager } from "./components/Admin/DonationsManager";
import { EventsManager } from "./components/Admin/EventsManager";
import { GalleryManager } from "./components/Admin/GalleryManager";
import { MembersManager } from "./components/Admin/MembersManager";
import { MinistriesManager } from "./components/Admin/MinistriesManager";
import { RequestsManager } from "./components/Admin/RequestsManager";
import { SuggestionsManager } from "./components/Admin/SuggestionsManager";
import { TitlesManager } from "./components/Admin/TitlesManager";
import { Footer } from "./components/Layout/Footer";
import { Header } from "./components/Layout/Header";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ProfileRedirect } from "./components/common/ProfileRedirect";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./i18n/config";
import { CompleteProfilePage } from "./pages/CompleteProfilePage";
import { ContactPage } from "./pages/ContactPage";
import { DepartmentDetailPage } from "./pages/DepartmentDetailPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { DonationsPage } from "./pages/DonationsPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import { EventsPage } from "./pages/EventsPage";
import { FinancialTransparencyPage } from "./pages/FinancialTransparencyPage";
import { GalleryPage } from "./pages/GalleryPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MembersPage } from "./pages/MembersPage";
import { MinistriesPage } from "./pages/MinistriesPage";
import { MinistryDetailPage } from "./pages/MinistryDetailPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { RequestsPage } from "./pages/RequestsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { SignupPage } from "./pages/SignupPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";
import { TermsAndConditionsPage } from "./pages/TermsAndConditionsPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";

const theme = createTheme({
  palette: {
    mode: "light",
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
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
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
      textTransform: "none",
      fontWeight: 400,
      letterSpacing: "0.01em",
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
          padding: "8px 22px",
          fontSize: "17px",
          fontWeight: 400,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <BrowserRouter>
              <ProfileRedirect>
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
                      path="/services"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <ServicesPage />
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
                    <Route
                      path="/suggestions"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <SuggestionsPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/donations"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <DonationsPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/financial-transparency"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <FinancialTransparencyPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/departments"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <DepartmentsPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/departments/:id"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <DepartmentDetailPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/ministries"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <MinistriesPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/ministries/:id"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <MinistryDetailPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/privacy-policy"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <PrivacyPolicyPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />
                    <Route
                      path="/terms-and-conditions"
                      element={
                        <>
                          <Header />
                          <Box component="main" sx={{ flexGrow: 1 }}>
                            <TermsAndConditionsPage />
                          </Box>
                          <Footer />
                        </>
                      }
                    />

                    {/* Auth Routes */}
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/verify-email"
                      element={<EmailVerificationPage />}
                    />
                    <Route
                      path="/profile/complete"
                      element={
                        <ProtectedRoute requireAdmin={false}>
                          <>
                            <Header />
                            <Box component="main" sx={{ flexGrow: 1 }}>
                              <CompleteProfilePage />
                            </Box>
                            <Footer />
                          </>
                        </ProtectedRoute>
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
                      <Route
                        path="departments"
                        element={<DepartmentsManager />}
                      />
                      <Route
                        path="ministries"
                        element={<MinistriesManager />}
                      />
                      <Route path="gallery" element={<GalleryManager />} />
                      <Route path="donations" element={<DonationsManager />} />
                      <Route path="requests" element={<RequestsManager />} />
                      <Route
                        path="suggestions"
                        element={<SuggestionsManager />}
                      />
                      <Route path="titles" element={<TitlesManager />} />
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
              </ProfileRedirect>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
