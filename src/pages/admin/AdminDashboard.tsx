import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { membersService } from '../../services/membersService';
import { eventsService } from '../../services/eventsService';
import { requestsService } from '../../services/requestsService';
import { contactService } from '../../services/contactService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    pendingRequests: 0,
    contactSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [members, events, requests, contacts] = await Promise.all([
          membersService.getAll(),
          eventsService.getAll(),
          requestsService.getAll(),
          contactService.getAll(),
        ]);

        setStats({
          members: members.length,
          events: events.length,
          pendingRequests: requests.filter((r) => r.status === 'pending').length,
          contactSubmissions: contacts.length,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mt: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Members
            </Typography>
            <Typography variant="h4">{stats.members}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Events
            </Typography>
            <Typography variant="h4">{stats.events}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Pending Requests
            </Typography>
            <Typography variant="h4">{stats.pendingRequests}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Contact Submissions
            </Typography>
            <Typography variant="h4">{stats.contactSubmissions}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

