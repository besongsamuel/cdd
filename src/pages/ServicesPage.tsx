import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CelebrationIcon from "@mui/icons-material/Celebration";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupIcon from "@mui/icons-material/Group";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";

interface ServiceSegment {
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const ServicesPage = () => {
  const { t } = useTranslation("services");

  const serviceSegments: ServiceSegment[] = [
    {
      time: t("schedule.openingPrayer.time"),
      title: t("schedule.openingPrayer.title"),
      description: t("schedule.openingPrayer.description"),
      icon: <FavoriteIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    },
    {
      time: t("schedule.praiseWorship.time"),
      title: t("schedule.praiseWorship.title"),
      description: t("schedule.praiseWorship.description"),
      icon: <MusicNoteIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    },
    {
      time: t("schedule.moderation.time"),
      title: t("schedule.moderation.title"),
      description: t("schedule.moderation.description"),
      icon: <CelebrationIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    },
    {
      time: t("schedule.preaching.time"),
      title: t("schedule.preaching.title"),
      description: t("schedule.preaching.description"),
      icon: <GroupIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    },
  ];

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/services" />
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        {/* Decorative Background Illustration */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.06,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Rays of light from top */}
            <g transform="translate(600, 0)">
              <path
                d="M 0 0 L -150 200 L -100 200 L 0 150 Z"
                fill="url(#gradient1)"
                opacity="0.8"
              />
              <path
                d="M 0 0 L 150 200 L 100 200 L 0 150 Z"
                fill="url(#gradient1)"
                opacity="0.8"
              />
              <path
                d="M 0 0 L -250 350 L -180 350 L 0 250 Z"
                fill="url(#gradient2)"
                opacity="0.6"
              />
              <path
                d="M 0 0 L 250 350 L 180 350 L 0 250 Z"
                fill="url(#gradient2)"
                opacity="0.6"
              />
            </g>

            {/* Musical notes scattered */}
            <g transform="translate(200, 300)">
              <path
                d="M 0 0 Q -15 -20 0 -40 Q 15 -20 0 0 M 0 -40 L 0 -60 M -5 -60 L 5 -60"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>
            <g transform="translate(900, 200)">
              <path
                d="M 0 0 Q -15 -20 0 -40 Q 15 -20 0 0 M 0 -40 L 0 -60 M -5 -60 L 5 -60"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>
            <g transform="translate(1100, 500)">
              <circle cx="0" cy="0" r="8" fill="#2563eb" opacity="0.6" />
              <path
                d="M 0 -10 L 0 -30 M -3 -30 L 3 -30"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>

            {/* Hands raised in worship */}
            <g transform="translate(100, 600)">
              <ellipse
                cx="0"
                cy="-30"
                rx="25"
                ry="35"
                fill="#3b82f6"
                opacity="0.4"
              />
              <path
                d="M -15 -30 Q -20 -50 -10 -65 Q 0 -70 10 -65 Q 20 -50 15 -30"
                fill="#2563eb"
                opacity="0.5"
              />
              <path
                d="M -20 0 Q -25 15 -20 30 Q -15 40 -10 35 Q -5 30 -10 20 Q -12 10 -15 5 Z"
                fill="#2563eb"
                opacity="0.5"
              />
              <path
                d="M 20 0 Q 25 15 20 30 Q 15 40 10 35 Q 5 30 10 20 Q 12 10 15 5 Z"
                fill="#2563eb"
                opacity="0.5"
              />
            </g>

            {/* Circular patterns */}
            <circle
              cx="300"
              cy="150"
              r="80"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              opacity="0.4"
            />
            <circle
              cx="300"
              cy="150"
              r="60"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              opacity="0.3"
            />
            <circle
              cx="900"
              cy="650"
              r="100"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.4"
            />
            <circle
              cx="900"
              cy="650"
              r="75"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Gradient definitions */}
            <defs>
              <linearGradient
                id="gradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient
                id="gradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
        </Box>

        <Container
          sx={{
            py: { xs: 4, md: 6 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Hero Section */}
          <Box sx={{ mb: { xs: 5, md: 6 }, textAlign: "center" }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontSize: { xs: "32px", md: "40px" }, mb: 2 }}
            >
              {t("title")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: "16px", md: "18px" },
                maxWidth: "700px",
                mx: "auto",
              }}
            >
              {t("subtitle")}
            </Typography>
          </Box>

          {/* Worship Style Section */}
          <Card
            sx={{
              mb: { xs: 4, md: 5 },
              background:
                "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
              border: "1px solid rgba(30, 58, 138, 0.1)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontSize: { xs: "24px", md: "28px" }, mb: 2 }}
              >
                {t("worshipStyle.title")}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: { xs: "16px", md: "17px" }, lineHeight: 1.7 }}
              >
                {t("worshipStyle.description")}
              </Typography>
            </CardContent>
          </Card>

          {/* Service Schedule Section */}
          <Box sx={{ mb: { xs: 4, md: 5 } }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              textAlign="center"
              sx={{ fontSize: { xs: "24px", md: "28px" }, mb: 4 }}
            >
              {t("schedule.title")}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                maxWidth: "800px",
                mx: "auto",
              }}
            >
              {serviceSegments.map((segment, index) => (
                <Card
                  key={index}
                  sx={{
                    borderLeft: `4px solid`,
                    borderLeftColor: "primary.main",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flex: { xs: "1 1 100%", sm: "0 0 auto" },
                          minWidth: { xs: "100%", sm: "200px" },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AccessTimeIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "16px", md: "18px" },
                              color: "primary.main",
                            }}
                          >
                            {segment.time}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 1,
                          }}
                        >
                          {segment.icon}
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "18px", md: "20px" },
                            }}
                          >
                            {segment.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "15px", md: "16px" },
                            lineHeight: 1.6,
                            pl: { xs: 0, sm: 6 },
                          }}
                        >
                          {segment.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: { xs: 4, md: 5 } }} />

          {/* New Members Section */}
          <Card
            sx={{
              mb: { xs: 4, md: 5 },
              background:
                "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(30, 58, 138, 0.05) 100%)",
              border: "1px solid rgba(37, 99, 235, 0.1)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <PersonAddIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{ fontSize: { xs: "24px", md: "28px" } }}
                >
                  {t("newMembers.title")}
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ fontSize: { xs: "16px", md: "17px" }, lineHeight: 1.7 }}
              >
                {t("newMembers.description")}
              </Typography>
            </CardContent>
          </Card>

          {/* First-Time Visitors Section */}
          <Box sx={{ mb: { xs: 4, md: 5 } }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              textAlign="center"
              sx={{ fontSize: { xs: "24px", md: "28px" }, mb: 4 }}
            >
              {t("firstTimeVisitors.title")}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 3,
                maxWidth: "900px",
                mx: "auto",
              }}
            >
              {[
                {
                  title: t("firstTimeVisitors.whatToExpect.title"),
                  items: t("firstTimeVisitors.whatToExpect.items", {
                    returnObjects: true,
                  }) as string[],
                  type: "items" as const,
                },
                {
                  title: t("firstTimeVisitors.whatToBring.title"),
                  items: t("firstTimeVisitors.whatToBring.items", {
                    returnObjects: true,
                  }) as string[],
                  type: "items" as const,
                },
                {
                  title: t("firstTimeVisitors.dressCode.title"),
                  description: t("firstTimeVisitors.dressCode.description"),
                  type: "description" as const,
                },
                {
                  title: t("firstTimeVisitors.children.title"),
                  description: t("firstTimeVisitors.children.description"),
                  type: "description" as const,
                },
              ].map((section, index) => (
                <Card
                  key={index}
                  sx={{
                    height: "100%",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Typography
                      variant="h6"
                      component="h3"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "18px", md: "20px" },
                        mb: 2,
                        color: "primary.main",
                      }}
                    >
                      {section.title}
                    </Typography>
                    {section.type === "items" && "items" in section ? (
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {section.items.map((item, itemIndex) => (
                          <Typography
                            key={itemIndex}
                            component="li"
                            variant="body2"
                            sx={{
                              fontSize: { xs: "15px", md: "16px" },
                              lineHeight: 1.7,
                              mb: 1,
                              color: "text.secondary",
                            }}
                          >
                            {item}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "15px", md: "16px" },
                          lineHeight: 1.7,
                          color: "text.secondary",
                        }}
                      >
                        {"description" in section ? section.description : ""}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Closing Message */}
          <Card
            sx={{
              mt: { xs: 4, md: 5 },
              background:
                "linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)",
              border: "1px solid rgba(30, 58, 138, 0.2)",
              textAlign: "center",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{ fontSize: { xs: "20px", md: "24px" }, mb: 2 }}
              >
                {t("closing.title")}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: { xs: "16px", md: "17px" }, lineHeight: 1.7 }}
              >
                {t("closing.message")}
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
};
