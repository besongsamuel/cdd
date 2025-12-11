import { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { eventsService } from '../services/eventsService';
import { regularProgramsService } from '../services/regularProgramsService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SEO } from '../components/SEO';
import type { Event, RegularProgram } from '../types';

const localizer = momentLocalizer(moment);

export const EventsPage = () => {
  const { t } = useTranslation('events');
  const [regularPrograms, setRegularPrograms] = useState<RegularProgram[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [programsData, eventsData] = await Promise.all([
          regularProgramsService.getAll(),
          eventsService.getAll(),
        ]);
        setRegularPrograms(programsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Convert events to calendar format
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(`${event.event_date}T${event.event_time || '00:00'}`),
    end: new Date(`${event.event_date}T${event.event_time || '23:59'}`),
    resource: event,
  }));

  return (
    <>
      <SEO title={t('title')} description={t('title')} url="/events" />
      <Container sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom textAlign="center">
          {t('title')}
        </Typography>

        {/* Regular Programs Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            {t('regularPrograms')}
          </Typography>
          <Paper sx={{ mt: 2 }}>
            <List>
              {regularPrograms.length === 0 ? (
                <ListItem>
                  <ListItemText primary={t('noPrograms')} />
                </ListItem>
              ) : (
              regularPrograms.map((program, index) => (
                <div key={program.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${program.day} - ${program.time}`}
                      secondary={`${program.description} - ${program.location}`}
                    />
                  </ListItem>
                  {index < regularPrograms.length - 1 && <Divider />}
                </div>
              ))
            )}
          </List>
        </Paper>
      </Box>

        {/* Calendar Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            {t('upcomingEvents')}
          </Typography>
        <Paper sx={{ mt: 2, p: 2, height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            defaultView="month"
            views={['month', 'week', 'day']}
            onSelectEvent={(event) => {
              const eventData = event.resource as Event;
              alert(`${eventData.title}\n${eventData.description || ''}\n${eventData.location || ''}`);
            }}
          />
          </Paper>
        </Box>
      </Container>
    </>
  );
};

