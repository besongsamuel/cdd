import GroupsIcon from "@mui/icons-material/Groups";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { ministryMembersService } from "../services/ministryMembersService";
import { ministriesService } from "../services/ministriesService";
import type { Ministry } from "../types";

export const MinistriesPage = () => {
  const { t } = useTranslation("ministries");
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMinistries = async () => {
      try {
        const activeMinistries = await ministriesService.getActive();
        setMinistries(activeMinistries);

        // Load member counts for each ministry
        const counts: Record<string, number> = {};
        for (const ministry of activeMinistries) {
          const members = await ministryMembersService.getByMinistry(
            ministry.id
          );
          counts[ministry.id] = members.length;
        }
        setMemberCounts(counts);
      } catch (error) {
        console.error("Error loading ministries:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMinistries();
  }, []);

  if (loading) {
    return (
      <>
        <SEO
          title={t("title")}
          description={t("subtitle")}
          url="/ministries"
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/ministries" />
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
            {/* Animated Decorative Background */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.08,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 1000"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4">
                  <animate attributeName="stop-opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3">
                  <animate attributeName="stop-opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            {/* Animated Connected circles */}
            <g transform="translate(200, 200)">
              <circle cx="0" cy="0" r="60" fill="url(#gradient1)">
                <animate attributeName="r" values="60;70;60" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="150" cy="50" r="50" fill="#2563eb" opacity="0.3">
                <animate attributeName="r" values="50;60;50" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="300" cy="0" r="55" fill="#60a5fa" opacity="0.3">
                <animate attributeName="r" values="55;65;55" dur="4s" repeatCount="indefinite" />
              </circle>
              <line
                x1="60"
                y1="0"
                x2="100"
                y2="35"
                stroke="#2563eb"
                strokeWidth="3"
                opacity="0.4"
              />
              <line
                x1="210"
                y1="50"
                x2="245"
                y2="15"
                stroke="#2563eb"
                strokeWidth="3"
                opacity="0.4"
              />
            </g>

            {/* People silhouettes */}
            <g transform="translate(800, 300)">
              <circle cx="0" cy="0" r="25" fill="#3b82f6" opacity="0.4" />
              <path
                d="M -15 30 Q -15 45 0 50 Q 15 45 15 30 L 15 60 Q 15 75 0 80 Q -15 75 -15 60 Z"
                fill="#2563eb"
                opacity="0.4"
              />
            </g>
            <g transform="translate(900, 280)">
              <circle cx="0" cy="0" r="25" fill="#60a5fa" opacity="0.4" />
              <path
                d="M -15 30 Q -15 45 0 50 Q 15 45 15 30 L 15 60 Q 15 75 0 80 Q -15 75 -15 60 Z"
                fill="#3b82f6"
                opacity="0.4"
              />
            </g>
            <g transform="translate(1000, 300)">
              <circle cx="0" cy="0" r="25" fill="#2563eb" opacity="0.4" />
              <path
                d="M -15 30 Q -15 45 0 50 Q 15 45 15 30 L 15 60 Q 15 75 0 80 Q -15 75 -15 60 Z"
                fill="#3b82f6"
                opacity="0.4"
              />
            </g>

            {/* Gear/team icons */}
            <g transform="translate(150, 600)">
              <circle
                cx="0"
                cy="0"
                r="40"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                opacity="0.4"
              />
              <circle
                cx="0"
                cy="0"
                r="25"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                opacity="0.4"
              />
              <circle cx="0" cy="0" r="5" fill="#2563eb" opacity="0.5" />
              <rect
                x="-4"
                y="-25"
                width="8"
                height="10"
                fill="#3b82f6"
                opacity="0.5"
              />
              <rect
                x="-4"
                y="15"
                width="8"
                height="10"
                fill="#3b82f6"
                opacity="0.5"
              />
              <rect
                x="-25"
                y="-4"
                width="10"
                height="8"
                fill="#3b82f6"
                opacity="0.5"
              />
              <rect
                x="15"
                y="-4"
                width="10"
                height="8"
                fill="#3b82f6"
                opacity="0.5"
              />
            </g>

            {/* Abstract shapes */}
            <g transform="translate(950, 650)">
              <rect
                x="-30"
                y="-30"
                width="60"
                height="60"
                rx="15"
                fill="#60a5fa"
                opacity="0.2"
                transform="rotate(45)"
              />
              <rect
                x="-20"
                y="-20"
                width="40"
                height="40"
                rx="10"
                fill="#3b82f6"
                opacity="0.3"
                transform="rotate(45)"
              />
            </g>

            {/* Animated Connecting lines */}
            <path
              d="M 400 150 Q 600 200 800 150"
              stroke="#2563eb"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.4;0.2"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dasharray"
                values="0,200;100,200;200,0"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M 200 450 Q 600 500 1000 450"
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.4;0.2"
                dur="3.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dasharray"
                values="0,300;150,300;300,0"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>
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
          <Box
            sx={{
              textAlign: "center",
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.2s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(30px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: "32px", md: "48px" },
                mb: 2,
                fontWeight: 700,
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              {t("title")}
            </Typography>
            <Typography
              variant="body1"
              textAlign="center"
              color="text.secondary"
              sx={{
                mb: 2,
                fontSize: { xs: "16px", md: "18px" },
                maxWidth: "700px",
                mx: "auto",
                lineHeight: 1.6,
              }}
            >
              {t("intro")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mt: 3,
              }}
            >
              <GroupsIcon sx={{ color: "primary.main", fontSize: 28 }} />
              <Typography
                variant="body2"
                color="primary.main"
                sx={{ fontWeight: 600, fontSize: "16px" }}
              >
                {ministries.length} {ministries.length === 1 ? "Ministry" : "Ministries"}
              </Typography>
            </Box>
          </Box>

          {ministries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              {t("noMinistries")}
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {ministries.map((ministry, index) => (
                <Box
                  key={ministry.id}
                  sx={{
                    opacity: 0,
                    transform: "translateY(30px)",
                    animation: `fadeInUp 0.6s ease-out ${0.4 + index * 0.1}s forwards`,
                    "@keyframes fadeInUp": {
                      to: {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                    },
                  }}
                >
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "1px solid rgba(30, 58, 138, 0.1)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
                        transform: "scaleX(0)",
                        transformOrigin: "left",
                        transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      },
                      "&:hover": {
                        transform: "translateY(-8px) scale(1.02)",
                        boxShadow: "0 12px 40px rgba(30, 58, 138, 0.15)",
                        borderColor: "rgba(30, 58, 138, 0.3)",
                        "&::before": {
                          transform: "scaleX(1)",
                        },
                        "& .ministry-image": {
                          transform: "scale(1.1)",
                        },
                        "& .ministry-content": {
                          backgroundColor: "rgba(30, 58, 138, 0.02)",
                        },
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/ministries/${ministry.id}`)}
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        p: 0,
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          height: { xs: 200, sm: 220 },
                          overflow: "hidden",
                        }}
                      >
                        {ministry.image_url ? (
                          <CardMedia
                            component="img"
                            image={ministry.image_url}
                            alt={ministry.name}
                            className="ministry-image"
                            sx={{
                              height: "100%",
                              width: "100%",
                              objectFit: "cover",
                              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: "100%",
                              width: "100%",
                              background: "linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: 0,
                                background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
                              },
                            }}
                          >
                            <Typography
                              variant="h2"
                              sx={{
                                color: "primary.main",
                                fontWeight: 700,
                                opacity: 0.3,
                                fontSize: { xs: "48px", sm: "64px" },
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {ministry.name.charAt(0)}
                            </Typography>
                          </Box>
                        )}
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)",
                            height: "60px",
                            pointerEvents: "none",
                          }}
                        />
                      </Box>
                      <CardContent
                        className="ministry-content"
                        sx={{
                          flexGrow: 1,
                          p: 3,
                          transition: "background-color 0.3s ease",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                          <Typography
                            variant="h5"
                            component="h2"
                            sx={{
                              fontSize: { xs: "20px", md: "24px" },
                              fontWeight: 700,
                              color: "text.primary",
                              flexGrow: 1,
                            }}
                          >
                            {ministry.name}
                          </Typography>
                          {ministry.details?.activities && ministry.details.activities.length > 0 && (
                            <Chip
                              label={ministry.details.activities.length}
                              size="small"
                              sx={{
                                backgroundColor: "primary.main",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "11px",
                                height: "24px",
                              }}
                            />
                          )}
                        </Box>
                        {ministry.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              fontSize: { xs: "14px", md: "15px" },
                              lineHeight: 1.6,
                              flexGrow: 1,
                            }}
                          >
                            {ministry.description
                              .replace(/#{1,6}\s+/g, "")
                              .replace(/\*\*/g, "")
                              .substring(0, 150)}
                            {ministry.description.length > 150 ? "..." : ""}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            pt: 2,
                            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="primary.main"
                            sx={{
                              fontWeight: 600,
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <GroupsIcon sx={{ fontSize: 18 }} />
                            {t("memberCount", {
                              count: memberCounts[ministry.id] || 0,
                            })}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "primary.main",
                              fontWeight: 600,
                              fontSize: "13px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Learn More →
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};

