import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { membersService } from "../services/membersService";
import type { Member } from "../types";

// Component for Leader Card with image error handling
const LeaderCard = ({ leader }: { leader: Member }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card>
      {imageError || !leader.picture_url ? (
        <Box
          sx={{
            height: { xs: 200, sm: 250 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f7",
          }}
        >
          <Box
            sx={{
              width: { xs: 120, sm: 150 },
              height: { xs: 120, sm: 150 },
              color: "primary.main",
            }}
          >
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "100%" }}
            >
              {/* Person vector illustration - simple and clean */}
              {/* Head circle */}
              <circle
                cx="50"
                cy="30"
                r="14"
                fill="currentColor"
                opacity="0.12"
              />
              <circle
                cx="50"
                cy="30"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />

              {/* Body shape (rounded trapezoid) */}
              <path
                d="M 32 48 Q 32 52 50 52 Q 68 52 68 48 L 68 75 Q 68 80 50 80 Q 32 80 32 75 Z"
                fill="currentColor"
                opacity="0.12"
              />
              <path
                d="M 32 48 Q 32 52 50 52 Q 68 52 68 48 L 68 75 Q 68 80 50 80 Q 32 80 32 75 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
        </Box>
      ) : (
        <CardMedia
          component="img"
          image={leader.picture_url}
          alt={leader.name}
          sx={{
            objectFit: "cover",
            height: { xs: 200, sm: 250 },
          }}
          onError={handleImageError}
        />
      )}
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {leader.name}
        </Typography>
        {leader.bio && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {leader.bio}
          </Typography>
        )}
        {(leader.email || leader.phone) && (
          <Box
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            {leader.email && (
              <Typography variant="caption" color="text.secondary">
                📧 {leader.email}
              </Typography>
            )}
            {leader.phone && (
              <Typography variant="caption" color="text.secondary">
                📞 {leader.phone}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const MembersPage = () => {
  const { t } = useTranslation("members");
  const [leaders, setLeaders] = useState<Member[]>([]);
  const [regularMembers, setRegularMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const [leadersData, regularData] = await Promise.all([
          membersService.getLeaders(),
          membersService.getRegularMembers(),
        ]);
        setLeaders(leadersData);
        setRegularMembers(regularData);
      } catch (error) {
        console.error("Error loading members:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  // Calculate passion frequencies for word cloud
  const passionFrequencies = (() => {
    const allMembers = [...leaders, ...regularMembers];
    const frequencies: Record<string, number> = {};

    allMembers.forEach((member) => {
      if (member.passions && member.passions.length > 0) {
        member.passions.forEach((passion) => {
          const normalized = passion.trim();
          if (normalized) {
            frequencies[normalized] = (frequencies[normalized] || 0) + 1;
          }
        });
      }
    });

    return frequencies;
  })();

  // Convert to array and sort by frequency
  const sortedPassions = Object.entries(passionFrequencies)
    .map(([passion, count]) => ({ passion, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate font size based on frequency (scale between min and max)
  const getFontSize = (count: number, maxCount: number) => {
    if (maxCount === 0) return 14;
    const minSize = 14;
    const maxSize = 48;
    const ratio = count / maxCount;
    return minSize + (maxSize - minSize) * ratio;
  };

  // Color palette for word cloud - gradient-inspired colors
  const colors = [
    "#1e3a8a", // Primary blue
    "#2563eb", // Bright blue
    "#3b82f6", // Light blue
    "#06b6d4", // Cyan
    "#10b981", // Green
    "#059669", // Dark green
    "#8b5cf6", // Purple
    "#7c3aed", // Dark purple
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#dc2626", // Dark red
  ];

  const getColor = (index: number) => {
    return colors[index % colors.length];
  };

  // Generate random rotation for visual interest
  const getRotation = (index: number) => {
    const rotations = [-5, -3, -2, 0, 2, 3, 5];
    return rotations[index % rotations.length];
  };

  const maxFrequency = sortedPassions[0]?.count || 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title={t("title")} description={t("title")} url="/members" />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          textAlign="center"
          sx={{ fontSize: { xs: "32px", md: "40px" } }}
        >
          {t("title")}
        </Typography>

        {/* Leaders Section */}
        <Box sx={{ mt: { xs: 4, md: 6 } }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontSize: { xs: "24px", md: "32px" } }}
          >
            {t("leaders")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
              mt: 2,
            }}
          >
            {leaders.length === 0 ? (
              <Typography color="text.secondary">{t("noLeaders")}</Typography>
            ) : (
              leaders.map((leader) => (
                <LeaderCard key={leader.id} leader={leader} />
              ))
            )}
          </Box>
        </Box>

        {/* Regular Members Section */}
        <Box sx={{ mt: { xs: 6, md: 8 } }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontSize: { xs: "24px", md: "32px" } }}
          >
            {t("members")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
              mt: 2,
            }}
          >
            {regularMembers.length === 0 ? (
              <Typography color="text.secondary">{t("noMembers")}</Typography>
            ) : (
              regularMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {member.name}
                    </Typography>
                    {(member.email || member.phone) && (
                      <Box
                        sx={{
                          mt: 0.5,
                          mb: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {member.email && (
                          <Typography variant="caption" color="text.secondary">
                            📧 {member.email}
                          </Typography>
                        )}
                        {member.phone && (
                          <Typography variant="caption" color="text.secondary">
                            📞 {member.phone}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {member.passions && member.passions.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        {member.passions.map((passion, index) => (
                          <Chip
                            key={index}
                            label={passion}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Box>

        {/* Word Cloud Section */}
        {sortedPassions.length > 0 && (
          <Box sx={{ mt: { xs: 8, md: 12 } }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              textAlign="center"
              sx={{
                fontSize: { xs: "24px", md: "32px" },
                mb: 4,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {t("passionWordCloud")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 2, sm: 2.5, md: 3 },
                justifyContent: "center",
                alignItems: "center",
                py: { xs: 4, md: 6 },
                px: { xs: 3, sm: 4, md: 5 },
                background: "linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%)",
                borderRadius: 3,
                boxShadow: "0 2px 20px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(30, 58, 138, 0.3) 50%, transparent 100%)",
                },
              }}
            >
              {sortedPassions.map(({ passion, count }, index) => (
                <Box
                  key={passion}
                  component="span"
                  sx={{
                    display: "inline-block",
                    fontSize: `${getFontSize(count, maxFrequency)}px`,
                    fontWeight:
                      count >= maxFrequency * 0.7
                        ? 700
                        : count >= maxFrequency * 0.4
                        ? 600
                        : 500,
                    color: getColor(index),
                    opacity: 0.9 + (count / maxFrequency) * 0.1,
                    transform: `rotate(${getRotation(index)}deg)`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "default",
                    lineHeight: 1.2,
                    textShadow:
                      count >= maxFrequency * 0.5
                        ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                        : "none",
                    px: { xs: 0.5, sm: 1 },
                    py: 0.5,
                    "&:hover": {
                      opacity: 1,
                      transform: `rotate(0deg) scale(1.12)`,
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                      zIndex: 1,
                    },
                  }}
                >
                  {passion}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
};
