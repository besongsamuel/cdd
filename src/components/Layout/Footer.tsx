import { Box, Container, Typography, IconButton, Link as MuiLink } from '@mui/material';
import { useEffect, useState } from 'react';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useTranslation } from 'react-i18next';
import { SOCIAL_MEDIA_LINKS } from '../../utils/constants';

export const Footer = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#f5f5f7',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        py: { xs: 5, md: 8 },
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(30, 58, 138, 0.2) 50%, transparent 100%)',
        },
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          gap={4}
          position="relative"
          sx={{ zIndex: 1 }}
        >
          <Box
            sx={{
              textAlign: { xs: 'center', sm: 'left' },
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.01em',
              }}
            >
              © {currentYear} {t('appName')}. {t('allRightsReserved')}
            </Typography>
          </Box>
          <Box
            sx={{
              textAlign: 'center',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.01em',
              }}
            >
              {t('designedBy')}
            </Typography>
          </Box>
          <Box 
            display="flex" 
            gap={1.5}
            sx={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            }}
          >
            <IconButton
              component={MuiLink}
              href={SOCIAL_MEDIA_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                width: 44,
                height: 44,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: '#1877F2',
                  backgroundColor: 'rgba(24, 119, 242, 0.1)',
                  transform: 'translateY(-4px) scale(1.1)',
                  boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
                },
              }}
            >
              <FacebookIcon />
            </IconButton>
            <IconButton
              component={MuiLink}
              href={SOCIAL_MEDIA_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                width: 44,
                height: 44,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: '#E4405F',
                  backgroundColor: 'rgba(228, 64, 95, 0.1)',
                  transform: 'translateY(-4px) scale(1.1)',
                  boxShadow: '0 4px 12px rgba(228, 64, 95, 0.3)',
                },
              }}
            >
              <InstagramIcon />
            </IconButton>
            <IconButton
              component={MuiLink}
              href={SOCIAL_MEDIA_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                width: 44,
                height: 44,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: '#FF0000',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  transform: 'translateY(-4px) scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
                },
              }}
            >
              <YouTubeIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};


