import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { churchInfoService } from '../services/churchInfoService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { YouTubeVideos } from '../components/YouTubeVideos';
import { MissionCard } from '../components/MissionCard';
import { CHURCH_LOGO_URL } from '../utils/constants';
import foundersImage from '../assets/491100347_18079396636707663_2804182089416872660_n.jpg';
import type { ChurchInfo } from '../types';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';

export const LandingPage = () => {
  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChurchInfo = async () => {
      try {
        const info = await churchInfoService.get();
        setChurchInfo(info);
      } catch (error) {
        console.error('Error loading church info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChurchInfo();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const missions = [
    {
      number: 1,
      title: 'Form Disciples',
      description: 'Form disciples and send them to serve the Kingdom',
      icon: <GroupsIcon />,
    },
    {
      number: 2,
      title: 'Discover Gifts',
      description: 'Discover gifts, potential and capacities of Christians, encourage and direct them on their use and effectiveness',
      icon: <AutoAwesomeIcon />,
    },
    {
      number: 3,
      title: 'Win Souls',
      description: 'Win souls for the Kingdom',
      icon: <FavoriteIcon />,
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section - Apple style */}
      <Box
        sx={{
          minHeight: { xs: '85vh', md: '90vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 3,
          py: { xs: 12, md: 16 },
        }}
      >
        <Container maxWidth="md">
          <Box
            component="img"
            src={CHURCH_LOGO_URL}
            alt="City of David Logo"
            sx={{
              width: { xs: 120, md: 160 },
              height: 'auto',
              mx: 'auto',
              mb: 5,
              objectFit: 'contain',
              opacity: 0,
              animation: 'fadeIn 1s ease-in-out 0.3s forwards',
              '@keyframes fadeIn': {
                to: { opacity: 1 },
              },
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '48px', sm: '64px', md: '80px' },
              fontWeight: 600,
              mb: 2,
              letterSpacing: '-0.02em',
              opacity: 0,
              animation: 'fadeInUp 0.8s ease-out 0.5s forwards',
              '@keyframes fadeInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            City of David
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              fontSize: { xs: '19px', md: '24px' },
              fontWeight: 400,
              color: 'text.secondary',
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.47059,
              opacity: 0,
              animation: 'fadeInUp 0.8s ease-out 0.7s forwards',
            }}
          >
            A bilingual Christian church in Montreal, founded in 2004 by Pastors Mireille and John BISOKA
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              opacity: 0,
              animation: 'fadeInUp 0.8s ease-out 0.9s forwards',
            }}
          >
            <Button
              component={Link}
              to="/events"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '17px',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Join Us
            </Button>
            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'text.primary',
                px: 4,
                py: 1.5,
                fontSize: '17px',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Contact Us
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Missions Section - Clean and minimal */}
      <Box sx={{ bgcolor: '#f5f5f7', py: { xs: 12, md: 16 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '40px', md: '56px' },
                fontWeight: 600,
                mb: 2,
                letterSpacing: '-0.02em',
              }}
            >
              Our Mission
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                fontSize: { xs: '19px', md: '21px' },
                fontWeight: 400,
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.47059,
              }}
            >
              The City of David church has a mission to transform lives through the power of God's word
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
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

      {/* Founders Section - Apple style */}
      <Box sx={{ bgcolor: 'background.default', py: { xs: 12, md: 16 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '40px', md: '56px' },
                fontWeight: 600,
                mb: 2,
                letterSpacing: '-0.02em',
              }}
            >
              Our Founders
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                fontSize: { xs: '19px', md: '21px' },
                fontWeight: 400,
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.47059,
              }}
            >
              Pastors Mireille and John BISOKA received the vision for this work in 2004
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 6, md: 8 },
              alignItems: 'center',
              mb: { xs: 8, md: 12 },
            }}
          >
            {/* Founders Image */}
            <Box
              sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                '& img': {
                  width: '100%',
                  height: 'auto',
                  display: 'block',
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <Typography
                  variant="h4"
                  component="h3"
                  sx={{
                    fontSize: { xs: '28px', md: '32px' },
                    fontWeight: 600,
                    mb: 2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Apostle Mireille Bisoka
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '17px',
                    lineHeight: 1.47059,
                    color: 'text.secondary',
                  }}
                >
                  Apostle Mireille Bisoka is a dedicated servant of God with a passion for discipleship and spiritual growth. 
                  Together with her husband, she has been instrumental in building the City of David church community, 
                  focusing on empowering believers to discover and utilize their God-given gifts and talents.
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  component="h3"
                  sx={{
                    fontSize: { xs: '28px', md: '32px' },
                    fontWeight: 600,
                    mb: 2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Pastor John Bisoka
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '17px',
                    lineHeight: 1.47059,
                    color: 'text.secondary',
                  }}
                >
                  Pastor John Bisoka is a visionary leader committed to spreading the gospel and winning souls for the Kingdom. 
                  With unwavering faith and dedication, he has led the City of David church since its founding in 2004, 
                  creating a place where the broken, rejected, and lost can find hope and restoration in Christ.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* YouTube Videos Section */}
      <YouTubeVideos />
    </Box>
  );
};
