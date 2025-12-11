import { Box, Container, Typography, IconButton, Link as MuiLink } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useTranslation } from 'react-i18next';
import { SOCIAL_MEDIA_LINKS } from '../../utils/constants';

export const Footer = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#f5f5f7',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          gap={3}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '13px',
            }}
          >
            © {currentYear} {t('appName')}. {t('allRightsReserved')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '13px',
            }}
          >
            {t('designedBy')}
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton
              component={MuiLink}
              href={SOCIAL_MEDIA_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'all 0.2s ease',
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
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'all 0.2s ease',
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
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'all 0.2s ease',
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


