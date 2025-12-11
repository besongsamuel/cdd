import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { YouTubeVideos } from '../components/YouTubeVideos';
import { MissionCard } from '../components/MissionCard';
import { SEO } from '../components/SEO';
import { CHURCH_LOGO_URL } from '../utils/constants';
import foundersImage from '../assets/491100347_18079396636707663_2804182089416872660_n.jpg';
import dancingImage from '../assets/dancing.jpg';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';

export const LandingPage = () => {
  const { t } = useTranslation('landing');

  const missions = [
    {
      number: 1,
      title: t('mission1.title'),
      description: t('mission1.description'),
      icon: <GroupsIcon />,
    },
    {
      number: 2,
      title: t('mission2.title'),
      description: t('mission2.description'),
      icon: <AutoAwesomeIcon />,
    },
    {
      number: 3,
      title: t('mission3.title'),
      description: t('mission3.description'),
      icon: <FavoriteIcon />,
    },
  ];

  return (
    <>
      <SEO
        title={t('title')}
        description={t('subtitle')}
        url="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: t('title'),
          description: t('subtitle'),
          url: typeof window !== 'undefined' ? window.location.origin : '',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '6506 Av. Papineau',
            addressLocality: 'Montréal',
            addressRegion: 'QC',
            postalCode: 'H2G 2X2',
            addressCountry: 'CA',
          },
          telephone: '+1-514-712-2927',
        }}
      />
      <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section - Background Image with Overlay */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '85vh', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${dancingImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            animation: 'zoomIn 20s ease-in-out infinite alternate',
            '@keyframes zoomIn': {
              '0%': {
                transform: 'scale(1)',
              },
              '100%': {
                transform: 'scale(1.1)',
              },
            },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(37, 99, 235, 0.75) 100%)',
            zIndex: 1,
          },
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            position: 'relative',
            zIndex: 2,
            px: 3,
            py: { xs: 8, md: 12 },
          }}
        >
          <Box
            component="img"
            src={CHURCH_LOGO_URL}
            alt="City of David Logo"
            sx={{
              width: { xs: 120, md: 180 },
              height: 'auto',
              mx: 'auto',
              mb: 5,
              objectFit: 'contain',
              opacity: 0,
              animation: 'fadeIn 1s ease-in-out 0.3s forwards',
              filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))',
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
              mb: 3,
              letterSpacing: '-0.02em',
              color: 'white',
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)',
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
            {t('title')}
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              fontSize: { xs: '19px', md: '24px' },
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.95)',
              mb: 6,
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.47059,
              textShadow: '0 1px 10px rgba(0, 0, 0, 0.4)',
              opacity: 0,
              animation: 'fadeInUp 0.8s ease-out 0.7s forwards',
            }}
          >
            {t('subtitle')}
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
                backgroundColor: 'white',
                color: 'primary.main',
                px: 5,
                py: 1.8,
                fontSize: '17px',
                fontWeight: 500,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  transform: 'scale(1.05) translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.4)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {t('joinUs')}
            </Button>
            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2,
                color: 'white',
                px: 5,
                py: 1.8,
                fontSize: '17px',
                fontWeight: 500,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05) translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.3)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {t('contactUs')}
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
                mb: 3,
                letterSpacing: '-0.02em',
              }}
            >
              {t('ourMission')}
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                fontSize: { xs: '19px', md: '21px' },
                fontWeight: 400,
                color: 'text.secondary',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.47059,
                mb: 2,
              }}
            >
              {t('missionDescription')}
            </Typography>
            <Typography
              variant="body1"
              component="p"
              sx={{
                fontSize: { xs: '17px', md: '19px' },
                fontWeight: 400,
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.47059,
              }}
            >
              {t('missionSubDescription')}
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
              {t('ourFounders')}
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
              {t('foundersSubtitle')}
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
                  {t('apostleMireille.name')}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '17px',
                    lineHeight: 1.47059,
                    color: 'text.secondary',
                  }}
                >
                  {t('apostleMireille.bio')}
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
                  {t('pastorJohn.name')}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '17px',
                    lineHeight: 1.47059,
                    color: 'text.secondary',
                  }}
                >
                  {t('pastorJohn.bio')}
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
