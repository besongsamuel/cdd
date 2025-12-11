import {
  Avatar,
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
          <Avatar
            sx={{
              width: { xs: 120, sm: 150 },
              height: { xs: 120, sm: 150 },
              bgcolor: "primary.main",
              fontSize: { xs: "60px", sm: "75px" },
            }}
          >
            {leader.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Avatar>
        </Box>
      ) : (
        <CardMedia
          component="img"
          height={{ xs: 200, sm: 250 }}
          image={leader.picture_url}
          alt={leader.name}
          sx={{ objectFit: "cover" }}
          onError={handleImageError}
        />
      )}
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {leader.name}
        </Typography>
        {leader.bio && (
          <Typography variant="body2" color="text.secondary">
            {leader.bio}
          </Typography>
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
      </Container>
    </>
  );
};
