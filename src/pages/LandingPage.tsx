import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ForumIcon from "@mui/icons-material/Forum";
import GroupsIcon from "@mui/icons-material/Groups";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import SecurityIcon from "@mui/icons-material/Security";
import TopicIcon from "@mui/icons-material/Topic";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import cddLogo from "../assets/cddLogo.png";
import cddLogoKinshasa from "../assets/cddLogoKinshasa.png";
import dancingImage from "../assets/dancing.jpg";
import foundersImage from "../assets/pastors-bisoka.png";
import { MissionCard } from "../components/MissionCard";
import { SEO } from "../components/SEO";
import { TestimoniesSlider } from "../components/TestimoniesSlider";
import { YouTubeVideos } from "../components/YouTubeVideos";
import { useCampus } from "../hooks/useCampus";
import type { CampusId } from "../utils/campuses";

type ScheduleItem = {
  when: string;
  time: string;
  title: string;
};

export const LandingPage = () => {
  const { t } = useTranslation("landing");
  const { campus, setCampus, config, isKinshasa, isMontreal } = useCampus();

  const campusSubtitle = t(`campuses.${campus}.subtitle`);
  const campusAddress = t(`campuses.${campus}.address`);
  const schedule = t(`campuses.${campus}.schedule`, {
    returnObjects: true,
  }) as ScheduleItem[];
  const heroLogo = isKinshasa ? cddLogoKinshasa : cddLogo;
  const primaryWhatsApp = config.phones.find((phone) => phone.whatsapp);

  const missions = [
    {
      number: 1,
      title: t("mission1.title"),
      description: t("mission1.description"),
      icon: <GroupsIcon />,
    },
    {
      number: 2,
      title: t("mission2.title"),
      description: t("mission2.description"),
      icon: <AutoAwesomeIcon />,
    },
    {
      number: 3,
      title: t("mission3.title"),
      description: t("mission3.description"),
      icon: <FavoriteIcon />,
    },
  ];

  return (
    <>
      <SEO
        title={t("title")}
        description={campusSubtitle}
        url="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: t("title"),
          description: campusSubtitle,
          url: typeof window !== "undefined" ? window.location.origin : "",
          address: {
            "@type": "PostalAddress",
            ...config.schema.address,
          },
          telephone: config.schema.telephone,
        }}
      />
      <Box sx={{ bgcolor: "background.default" }}>
        {/* Hero Section - Background Image with Overlay */}
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: "auto", md: "100vh" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${dancingImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              zIndex: 0,
              animation: "zoomIn 20s ease-in-out infinite alternate",
              "@keyframes zoomIn": {
                "0%": {
                  transform: "scale(1)",
                },
                "100%": {
                  transform: "scale(1.1)",
                },
              },
            },
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(37, 99, 235, 0.75) 100%)",
              zIndex: 1,
            },
          }}
        >
          <Container
            maxWidth="md"
            sx={{
              position: "relative",
              zIndex: 2,
              px: 3,
              py: { xs: 6, md: 8 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                mb: { xs: 4, md: 5 },
              }}
            >
              <Box
                component="img"
                key={campus}
                src={heroLogo}
                alt={
                  isKinshasa
                    ? "Église Cité de David Kinshasa Logo"
                    : "City of David Logo"
                }
                sx={{
                  width: { xs: 200, md: 280 },
                  height: "auto",
                  display: "block",
                  mb: 2.5,
                  objectFit: "contain",
                  opacity: 0,
                  animation: "fadeInScale 0.6s ease-in-out forwards",
                  filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.4))",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  padding: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  "@keyframes fadeInScale": {
                    from: {
                      opacity: 0,
                      transform: "scale(0.9)",
                    },
                    to: {
                      opacity: 1,
                      transform: "scale(1)",
                    },
                  },
                }}
              />

              <ToggleButtonGroup
                exclusive
                value={campus}
                onChange={(_event, value: CampusId | null) => {
                  if (value) setCampus(value);
                }}
                aria-label={t("campusSwitcherLabel")}
                sx={{
                  display: "inline-flex",
                  alignSelf: "center",
                  bgcolor: "rgba(255, 255, 255, 0.14)",
                  borderRadius: 999,
                  p: 0.5,
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                  backdropFilter: "blur(10px)",
                  "& .MuiToggleButtonGroup-grouped": {
                    border: 0,
                    borderRadius: "999px !important",
                    minWidth: { xs: 108, sm: 120 },
                    px: 2,
                    py: 0.85,
                    color: "rgba(255, 255, 255, 0.88)",
                    fontSize: { xs: 13, sm: 14 },
                    fontWeight: 600,
                    textTransform: "none",
                    letterSpacing: "0.01em",
                    justifyContent: "center",
                    alignItems: "center",
                    lineHeight: 1.2,
                    "&.Mui-selected": {
                      bgcolor: "rgba(255, 255, 255, 0.95)",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 1)",
                      },
                    },
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.12)",
                    },
                  },
                }}
              >
                <ToggleButton value="montreal">
                  {t("campuses.montreal.label")}
                </ToggleButton>
                <ToggleButton value="kinshasa">
                  {t("campuses.kinshasa.label")}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: "48px", sm: "64px", md: "80px" },
                fontWeight: 600,
                mb: 3,
                letterSpacing: "-0.02em",
                color: "white",
                textAlign: "center",
                textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
                opacity: 0,
                animation: "fadeInUp 0.8s ease-out 0.5s forwards",
                "@keyframes fadeInUp": {
                  from: {
                    opacity: 0,
                    transform: "translateY(20px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
                },
              }}
            >
              {t("title")}
            </Typography>
            <Typography
              key={`${campus}-subtitle`}
              variant="h5"
              component="p"
              sx={{
                fontSize: { xs: "19px", md: "24px" },
                fontWeight: 400,
                color: "rgba(255, 255, 255, 0.95)",
                mb: 6,
                maxWidth: "700px",
                width: "100%",
                textAlign: "center",
                lineHeight: 1.47059,
                textShadow: "0 1px 10px rgba(0, 0, 0, 0.4)",
                animation: "fadeInUp 0.45s ease-out forwards",
              }}
            >
              {campusSubtitle}
            </Typography>
            {/* Service Info Banner */}
            <Box
              key={`${campus}-info`}
              sx={{
                mb: 4,
                width: "100%",
                maxWidth: isKinshasa ? 420 : 480,
                display: "flex",
                justifyContent: "center",
                animation: "fadeInUp 0.45s ease-out forwards",
              }}
            >
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "28px minmax(0, 1fr)",
                      columnGap: 1.5,
                      rowGap: 1.75,
                      alignItems: "center",
                      width: "fit-content",
                      maxWidth: "100%",
                      mx: "auto",
                      "& .info-icon": {
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        "& .MuiSvgIcon-root": {
                          fontSize: 22,
                        },
                      },
                    }}
                  >
                    {Array.isArray(schedule) &&
                      schedule.map((item) => (
                        <Box
                          key={`${item.when}-${item.time}`}
                          sx={{
                            display: "contents",
                          }}
                        >
                          <Box className="info-icon">
                            <AccessTimeIcon sx={{ color: "primary.main" }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "15px", sm: "16px" },
                                color: "text.primary",
                                lineHeight: 1.35,
                              }}
                            >
                              {item.when} · {item.time}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                fontSize: 14,
                                lineHeight: 1.35,
                                mt: 0.25,
                              }}
                            >
                              {item.title}
                            </Typography>
                          </Box>
                        </Box>
                      ))}

                    <Box
                      sx={{
                        gridColumn: "1 / -1",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box className="info-icon">
                        <LocationOnIcon sx={{ color: "primary.main" }} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "14px", sm: "15px" },
                          color: "text.secondary",
                          lineHeight: 1.2,
                          m: 0,
                        }}
                      >
                        {campusAddress}
                      </Typography>
                    </Box>

                    {config.phones.map((phone) => (
                      <Box
                        key={phone.tel}
                        sx={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Box className="info-icon">
                          {phone.whatsapp ? (
                            <WhatsAppIcon sx={{ color: "#25D366" }} />
                          ) : (
                            <PhoneIcon sx={{ color: "primary.main" }} />
                          )}
                        </Box>
                        <Typography
                          component="a"
                          href={
                            phone.whatsapp
                              ? `https://wa.me/${phone.whatsapp}`
                              : `tel:${phone.tel}`
                          }
                          target={phone.whatsapp ? "_blank" : undefined}
                          rel={
                            phone.whatsapp ? "noopener noreferrer" : undefined
                          }
                          variant="body2"
                          sx={{
                            fontSize: { xs: "14px", sm: "15px" },
                            color: "text.secondary",
                            textDecoration: "none",
                            lineHeight: 1.2,
                            m: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            "&:hover": {
                              color: "primary.main",
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {phone.display}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {isKinshasa && config.socialHandle && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1.75,
                        fontSize: 13,
                        color: "text.secondary",
                        lineHeight: 1.4,
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {t("campuses.kinshasa.socialHandle")}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 2 },
                justifyContent: "center",
                flexWrap: "wrap",
                animation: "fadeInUp 0.45s ease-out forwards",
              }}
            >
              {isMontreal && (
                <>
                  <Button
                    component={Link}
                    to="/signup"
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: "white",
                      color: "primary.main",
                      px: { xs: 4, sm: 5 },
                      py: { xs: 1.5, sm: 1.8 },
                      fontSize: { xs: "16px", sm: "17px" },
                      fontWeight: 500,
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                      minHeight: "48px",
                      minWidth: { xs: "140px", sm: "auto" },
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        transform: "scale(1.05) translateY(-2px)",
                        boxShadow: "0 6px 25px rgba(0, 0, 0, 0.4)",
                      },
                      "&:active": {
                        transform: "scale(0.98) translateY(0)",
                      },
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {t("joinUs")}
                  </Button>
                  <Button
                    component={Link}
                    to="/ministries"
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: "white",
                      color: "primary.main",
                      px: { xs: 4, sm: 5 },
                      py: { xs: 1.5, sm: 1.8 },
                      fontSize: { xs: "16px", sm: "17px" },
                      fontWeight: 500,
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                      minHeight: "48px",
                      minWidth: { xs: "140px", sm: "auto" },
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        transform: "scale(1.05) translateY(-2px)",
                        boxShadow: "0 6px 25px rgba(0, 0, 0, 0.4)",
                      },
                      "&:active": {
                        transform: "scale(0.98) translateY(0)",
                      },
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {t("viewMinistries")}
                  </Button>
                  <Button
                    component={Link}
                    to="/contact"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.8)",
                      borderWidth: 2,
                      color: "white",
                      px: { xs: 4, sm: 5 },
                      py: { xs: 1.5, sm: 1.8 },
                      fontSize: { xs: "16px", sm: "17px" },
                      fontWeight: 500,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      minHeight: "48px",
                      minWidth: { xs: "140px", sm: "auto" },
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        transform: "scale(1.05) translateY(-2px)",
                        boxShadow: "0 6px 25px rgba(0, 0, 0, 0.3)",
                      },
                      "&:active": {
                        transform: "scale(0.98) translateY(0)",
                      },
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {t("contactUs")}
                  </Button>
                </>
              )}

              {isKinshasa && (
                <>
                  {primaryWhatsApp && (
                    <Button
                      component="a"
                      href={`https://wa.me/${primaryWhatsApp.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="large"
                      startIcon={<WhatsAppIcon />}
                      sx={{
                        backgroundColor: "white",
                        color: "primary.main",
                        px: { xs: 4, sm: 5 },
                        py: { xs: 1.5, sm: 1.8 },
                        fontSize: { xs: "16px", sm: "17px" },
                        fontWeight: 500,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        minHeight: "48px",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          transform: "scale(1.05) translateY(-2px)",
                          boxShadow: "0 6px 25px rgba(0, 0, 0, 0.4)",
                        },
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {t("whatsAppUs")}
                    </Button>
                  )}
                  <Button
                    component="a"
                    href={`tel:${config.phones[0].tel}`}
                    variant="outlined"
                    size="large"
                    startIcon={<PhoneIcon />}
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.8)",
                      borderWidth: 2,
                      color: "white",
                      px: { xs: 4, sm: 5 },
                      py: { xs: 1.5, sm: 1.8 },
                      fontSize: { xs: "16px", sm: "17px" },
                      fontWeight: 500,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      minHeight: "48px",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        transform: "scale(1.05) translateY(-2px)",
                      },
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {t("callUs")}
                  </Button>
                </>
              )}
            </Box>
          </Container>
        </Box>

        {/* Missions Section - Clean and minimal */}
        <Box sx={{ bgcolor: "#f5f5f7", py: { xs: 12, md: 16 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: { xs: 8, md: 12 } }}>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: "40px", md: "56px" },
                  fontWeight: 600,
                  mb: 3,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("ourMission")}
              </Typography>
              <Typography
                variant="h6"
                component="p"
                sx={{
                  fontSize: { xs: "19px", md: "21px" },
                  fontWeight: 400,
                  color: "text.secondary",
                  maxWidth: "800px",
                  mx: "auto",
                  lineHeight: 1.47059,
                  mb: 2,
                }}
              >
                {t("missionDescription")}
              </Typography>
              <Typography
                variant="body1"
                component="p"
                sx={{
                  fontSize: { xs: "17px", md: "19px" },
                  fontWeight: 400,
                  color: "text.secondary",
                  maxWidth: "700px",
                  mx: "auto",
                  lineHeight: 1.47059,
                }}
              >
                {t("missionSubDescription")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: { xs: 4, md: 6 },
              }}
            >
              {missions.map((mission) => (
                <MissionCard
                  key={mission.number}
                  number={mission.number}
                  title={mission.title}
                  description={mission.description}
                  icon={mission.icon}
                />
              ))}
            </Box>
          </Container>
        </Box>

        {/* Testimonies Slider Section */}
        <TestimoniesSlider />

        {/* Message Boards Feature Section */}
        <Box
          sx={{
            bgcolor: "background.default",
            py: { xs: 12, md: 16 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                gap: { xs: 4, md: 6 },
              }}
            >
              {/* Left side - Icon and Title */}
              <Box
                sx={{
                  flex: { xs: "1", md: "0 0 300px" },
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: { xs: 100, md: 120 },
                    height: { xs: 100, md: 120 },
                    borderRadius: "50%",
                    bgcolor: (theme) =>
                      `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    mb: 4,
                    boxShadow: (theme) =>
                      `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                  }}
                >
                  <ForumIcon
                    sx={{
                      fontSize: { xs: 50, md: 60 },
                      color: "primary.main",
                    }}
                  />
                </Box>
                <Typography
                  variant="h2"
                  component="h2"
                  sx={{
                    fontSize: { xs: "36px", md: "48px" },
                    fontWeight: 700,
                    mb: 2,
                    letterSpacing: "-0.02em",
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("messageBoards.title")}
                </Typography>
                <Typography
                  variant="h6"
                  component="p"
                  sx={{
                    fontSize: { xs: "18px", md: "20px" },
                    fontWeight: 500,
                    color: "text.secondary",
                    mb: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {t("messageBoards.subtitle")}
                </Typography>
                <Button
                  component={Link}
                  to="/message-boards"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "17px",
                    fontWeight: 600,
                    borderRadius: 3,
                    textTransform: "none",
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: (theme) =>
                      `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: (theme) =>
                        `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {t("messageBoards.cta")}
                </Button>
              </Box>

              {/* Right side - Description and Features */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "17px", md: "19px" },
                    lineHeight: 1.7,
                    color: "text.secondary",
                    mb: 4,
                  }}
                >
                  {t("messageBoards.description")}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(3, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      p: 3,
                      borderRadius: 3,
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.03),
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: (theme) =>
                          `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <TopicIcon
                      sx={{
                        fontSize: 40,
                        color: "primary.main",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: "18px",
                      }}
                    >
                      {t("messageBoards.features.discussions")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {t("messageBoards.features.discussionsDesc")}
                    </Typography>
                  </Card>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      p: 3,
                      borderRadius: 3,
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.03),
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: (theme) =>
                          `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <GroupsIcon
                      sx={{
                        fontSize: 40,
                        color: "primary.main",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: "18px",
                      }}
                    >
                      {t("messageBoards.features.community")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {t("messageBoards.features.communityDesc")}
                    </Typography>
                  </Card>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      p: 3,
                      borderRadius: 3,
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.03),
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: (theme) =>
                          `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <SecurityIcon
                      sx={{
                        fontSize: 40,
                        color: "primary.main",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: "18px",
                      }}
                    >
                      {t("messageBoards.features.safe")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {t("messageBoards.features.safeDesc")}
                    </Typography>
                  </Card>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Founders Section - Apple style */}
        <Box sx={{ bgcolor: "background.default", py: { xs: 12, md: 16 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: { xs: 8, md: 12 } }}>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: "40px", md: "56px" },
                  fontWeight: 600,
                  mb: 2,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("ourFounders")}
              </Typography>
              <Typography
                variant="h6"
                component="p"
                sx={{
                  fontSize: { xs: "19px", md: "21px" },
                  fontWeight: 400,
                  color: "text.secondary",
                  maxWidth: "700px",
                  mx: "auto",
                  lineHeight: 1.47059,
                }}
              >
                {t("foundersSubtitle")}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 6, md: 8 },
                alignItems: "center",
                mb: { xs: 8, md: 12 },
              }}
            >
              {/* Founders Image */}
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  overflow: "hidden",
                  "& img": {
                    width: "100%",
                    height: "auto",
                    display: "block",
                  },
                }}
              >
                <Box
                  component="img"
                  src={foundersImage}
                  alt="Pastors Mireille and John BISOKA"
                />
              </Box>

              {/* Biographies */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Box>
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontSize: { xs: "28px", md: "32px" },
                      fontWeight: 600,
                      mb: 2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t("apostleMireille.name")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "17px",
                      lineHeight: 1.47059,
                      color: "text.secondary",
                    }}
                  >
                    {t("apostleMireille.bio")}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontSize: { xs: "28px", md: "32px" },
                      fontWeight: 600,
                      mb: 2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t("pastorJohn.name")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: "17px",
                      lineHeight: 1.47059,
                      color: "text.secondary",
                    }}
                  >
                    {t("pastorJohn.bio")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* YouTube Videos Section */}
        <YouTubeVideos />
      </Box>
    </>
  );
};
