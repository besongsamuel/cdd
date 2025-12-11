import { useEffect, useState } from 'react';
import { Container, Typography, Box, Card, CardMedia, CardContent, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { membersService } from '../services/membersService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SEO } from '../components/SEO';
import type { Member } from '../types';

export const MembersPage = () => {
  const { t } = useTranslation('members');
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
        console.error('Error loading members:', error);
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
      <SEO title={t('title')} description={t('title')} url="/members" />
      <Container sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom textAlign="center">
          {t('title')}
        </Typography>

        {/* Leaders Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            {t('leaders')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3,
              mt: 2,
            }}
          >
            {leaders.length === 0 ? (
              <Typography color="text.secondary">{t('noLeaders')}</Typography>
            ) : (
            leaders.map((leader) => (
              <Card key={leader.id}>
                <CardMedia
                  component="img"
                  height="250"
                  image={leader.picture_url || '/placeholder-member.jpg'}
                  alt={leader.name}
                  sx={{ objectFit: 'cover' }}
                />
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
            ))
          )}
        </Box>
      </Box>

        {/* Regular Members Section */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            {t('members')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
              mt: 2,
            }}
          >
            {regularMembers.length === 0 ? (
              <Typography color="text.secondary">{t('noMembers')}</Typography>
            ) : (
            regularMembers.map((member) => (
              <Card key={member.id}>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {member.name}
                  </Typography>
                  {member.passions && member.passions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {member.passions.map((passion, index) => (
                        <Chip key={index} label={passion} size="small" variant="outlined" />
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

