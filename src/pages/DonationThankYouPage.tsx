import { Box, Button, Container, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { SEO } from "../components/SEO";

// Bible verses about giving
const givingVerses = [
  {
    text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
    reference: "2 Corinthians 9:7",
  },
  {
    text: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.",
    reference: "Luke 6:38",
  },
  {
    text: "Honor the Lord with your wealth, with the firstfruits of all your crops.",
    reference: "Proverbs 3:9",
  },
  {
    text: "Whoever is kind to the poor lends to the Lord, and he will reward them for what they have done.",
    reference: "Proverbs 19:17",
  },
  {
    text: "Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously.",
    reference: "2 Corinthians 9:6",
  },
  {
    text: "Do not store up for yourselves treasures on earth, where moths and vermin destroy, and where thieves break in and steal. But store up for yourselves treasures in heaven.",
    reference: "Matthew 6:19-20",
  },
  {
    text: "It is more blessed to give than to receive.",
    reference: "Acts 20:35",
  },
  {
    text: "A generous person will prosper; whoever refreshes others will be refreshed.",
    reference: "Proverbs 11:25",
  },
];

// Animated SVG illustration component
const AnimatedHeartIllustration = () => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 400,
        height: 300,
        margin: "0 auto",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Helmet>
        <style>{`
          @keyframes donationPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }
          @keyframes donationFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          @keyframes donationHeartbeat {
            0%, 100% { transform: scale(1); }
            10%, 30% { transform: scale(1.1); }
            20%, 40% { transform: scale(1); }
          }
          .donation-pulse-1 {
            animation: donationPulse 3s ease-in-out infinite;
          }
          .donation-pulse-2 {
            animation: donationPulse 2.5s ease-in-out infinite 0.5s;
          }
          .donation-float-heart {
            animation: donationFloat 3s ease-in-out infinite;
          }
          .donation-heartbeat {
            animation: donationHeartbeat 2s ease-in-out infinite;
          }
          .donation-float-particle {
            animation: donationFloat 2s ease-in-out infinite;
          }
        `}</style>
      </Helmet>
      <Box
        component="div"
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          "& svg": {
            width: "100%",
            height: "100%",
          },
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated background circles */}
          <circle
            className="donation-pulse-1"
            cx="200"
            cy="150"
            r="80"
            fill="#e3f2fd"
            opacity="0.3"
          />
          <circle
            className="donation-pulse-2"
            cx="200"
            cy="150"
            r="60"
            fill="#bbdefb"
            opacity="0.4"
          />
          
          {/* Main heart */}
          <g className="donation-float-heart" transform="translate(200, 150)">
            <path
              className="donation-heartbeat"
              d="M 0,20 C -20,-20 -60,-20 -60,10 C -60,30 -20,50 0,70 C 20,50 60,30 60,10 C 60,-20 20,-20 0,20 Z"
              fill="#f44336"
            />
            <path
              d="M -15,25 C -25,15 -40,15 -40,25 C -40,35 -25,45 -15,55 C -5,45 10,35 10,25 C 10,15 -5,15 -15,25 Z"
              fill="#fff"
              opacity="0.8"
            />
            <path
              d="M 15,25 C 5,15 -10,15 -10,25 C -10,35 5,45 15,55 C 25,45 40,35 40,25 C 40,15 25,15 15,25 Z"
              fill="#fff"
              opacity="0.8"
            />
          </g>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <circle
              key={i}
              className="donation-float-particle"
              cx={100 + (i * 50)}
              cy={50 + (i % 3) * 80}
              r="4"
              fill="#4caf50"
              opacity="0.6"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            />
          ))}
        </svg>
      </Box>
    </Box>
  );
};

export const DonationThankYouPage = () => {
  const { t } = useTranslation("donations");
  const navigate = useNavigate();
  const [verse, setVerse] = useState(givingVerses[0]);

  useEffect(() => {
    // Select a random verse
    const randomVerse =
      givingVerses[Math.floor(Math.random() * givingVerses.length)];
    setVerse(randomVerse);
  }, []);

  return (
    <>
      <SEO
        title={t("thankYou.title") || "Thank You for Your Donation"}
        description={t("thankYou.description") || "Thank you for your generous donation"}
      />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            minHeight: "60vh",
          }}
        >
          {/* Animated Illustration - Background */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: 600,
              height: "100%",
              maxHeight: 500,
              opacity: 0.15,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <AnimatedHeartIllustration />
          </Box>

          {/* Content - Foreground */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
            }}
          >
            {/* Thank You Message */}
            <Box sx={{ mt: 2 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "primary.main",
                mb: 2,
              }}
            >
              {t("thankYou.title") || "Thank You!"}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: "auto", mb: 4 }}
            >
              {t("thankYou.message") ||
                "Your generous donation helps us serve our community and spread the gospel. We are truly grateful for your support!"}
            </Typography>
          </Box>

            {/* Bible Verse Card */}
            <Box
              sx={{
                backgroundColor: "background.paper",
                borderRadius: 3,
                p: 4,
                boxShadow: 3,
                maxWidth: 700,
                width: "100%",
                border: "2px solid",
                borderColor: "primary.light",
                mx: "auto",
              }}
            >
            <Box
              sx={{
                position: "relative",
                mb: 2,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontStyle: "italic",
                  fontSize: "1.2rem",
                  lineHeight: 1.8,
                  color: "text.primary",
                  position: "relative",
                  pl: 4,
                  pr: 4,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: "3rem",
                    color: "primary.main",
                    lineHeight: 0,
                    position: "absolute",
                    left: 0,
                    top: 0,
                  }}
                >
                  "
                </Box>
                {verse.text}
                <Box
                  component="span"
                  sx={{
                    fontSize: "3rem",
                    color: "primary.main",
                    lineHeight: 0,
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                  }}
                >
                  "
                </Box>
              </Typography>
            </Box>
            <Typography
              variant="subtitle2"
              color="primary.main"
              sx={{ fontWeight: 600, mt: 2 }}
            >
              — {verse.reference}
            </Typography>
            </Box>

            {/* Return Home Button */}
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/")}
              sx={{
                mt: 4,
                px: 6,
                py: 1.5,
                fontSize: "1.1rem",
                borderRadius: 2,
              }}
            >
              {t("thankYou.backToHome") || "Return to Home"}
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
};

