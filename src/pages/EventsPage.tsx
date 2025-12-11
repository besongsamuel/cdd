import {
  Box,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import moment from "moment";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { eventsService } from "../services/eventsService";
import { regularProgramsService } from "../services/regularProgramsService";
import type { Event, RegularProgram } from "../types";

const localizer = momentLocalizer(moment);

export const EventsPage = () => {
  const { t } = useTranslation("events");
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
        console.error("Error loading events:", error);
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
    start: new Date(`${event.event_date}T${event.event_time || "00:00"}`),
    end: new Date(`${event.event_date}T${event.event_time || "23:59"}`),
    resource: event,
  }));

  return (
    <>
      <SEO title={t("title")} description={t("title")} url="/events" />
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

        {/* Regular Programs Section */}
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontSize: { xs: "24px", md: "32px" } }}
          >
            {t("regularPrograms")}
          </Typography>
          <Paper sx={{ mt: 2 }}>
            <List>
              {regularPrograms.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={t("noPrograms")}
                    primaryTypographyProps={{
                      fontSize: { xs: "15px", md: "16px" },
                    }}
                  />
                </ListItem>
              ) : (
                regularPrograms.map((program, index) => (
                  <div key={program.id}>
                    <ListItem sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <ListItemText
                        primary={`${program.day} - ${program.time}`}
                        secondary={`${program.description} - ${program.location}`}
                        primaryTypographyProps={{
                          fontSize: { xs: "16px", md: "17px" },
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          fontSize: { xs: "14px", md: "15px" },
                        }}
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
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontSize: { xs: "28px", md: "32px" },
            }}
          >
            {t("upcomingEvents")}
          </Typography>
          <Paper
            sx={{
              mt: 2,
              p: { xs: 1, sm: 2 },
              height: { xs: "400px", sm: "500px", md: "600px" },
              overflow: "hidden",
            }}
          >
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              defaultView="month"
              views={["month", "week", "day", "agenda"]}
              onSelectEvent={(event) => {
                const eventData = event.resource as Event;
                alert(
                  `${eventData.title}\n${eventData.description || ""}\n${
                    eventData.location || ""
                  }`
                );
              }}
              popup
            />
          </Paper>
        </Box>
      </Container>
    </>
  );
};
