import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventDetailDialog } from "../components/common/EventDetailDialog";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { eventsService } from "../services/eventsService";
import { regularProgramsService } from "../services/regularProgramsService";
import type { Event, RegularProgram } from "../types";

export const EventsPage = () => {
  const { t } = useTranslation("events");
  const [regularPrograms, setRegularPrograms] = useState<RegularProgram[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
  const calendarEvents = events.map((event) => {
    const eventDate = new Date(event.event_date);
    const [hours, minutes] = event.event_time
      ? event.event_time.split(":").map(Number)
      : [0, 0];
    eventDate.setHours(hours, minutes, 0, 0);

    // Set end time (default to 1 hour if no time specified)
    const endDate = new Date(eventDate);
    if (!event.event_time) {
      endDate.setHours(endDate.getHours() + 1);
    } else {
      endDate.setHours(endDate.getHours() + 1);
    }

    return {
      id: event.id,
      title: event.title,
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      extendedProps: {
        description: event.description,
        location: event.location,
      },
    };
  });

  return (
    <>
      <SEO title={t("title")} description={t("title")} url="/events" />
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        {/* Decorative Background Illustration */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.06,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 1000"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Calendar grid */}
            <g transform="translate(100, 150)">
              <rect
                x="0"
                y="0"
                width="200"
                height="180"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                rx="8"
                opacity="0.4"
              />
              <line
                x1="0"
                y1="60"
                x2="200"
                y2="60"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="0"
                y1="120"
                x2="200"
                y2="120"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="66"
                y1="0"
                x2="66"
                y2="180"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="133"
                y1="0"
                x2="133"
                y2="180"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              <circle cx="33" cy="30" r="8" fill="#2563eb" opacity="0.5" />
              <circle cx="100" cy="90" r="8" fill="#3b82f6" opacity="0.5" />
              <circle cx="166" cy="150" r="8" fill="#60a5fa" opacity="0.5" />
            </g>

            {/* Clock */}
            <g transform="translate(900, 200)">
              <circle
                cx="0"
                cy="0"
                r="70"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                opacity="0.4"
              />
              <circle cx="0" cy="0" r="5" fill="#2563eb" opacity="0.6" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-40"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
              />
              <line
                x1="0"
                y1="0"
                x2="30"
                y2="0"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
              <circle cx="0" cy="0" r="3" fill="#2563eb" opacity="0.8" />
            </g>

            {/* Event banner/ribbon */}
            <g transform="translate(400, 500)">
              <path
                d="M -80 -20 L 80 -20 L 70 20 L -70 20 Z"
                fill="#3b82f6"
                opacity="0.3"
              />
              <path
                d="M -80 -20 Q -80 -30 -70 -30 L 70 -30 Q 80 -30 80 -20"
                fill="#2563eb"
                opacity="0.4"
              />
            </g>

            {/* Star decorations */}
            <g transform="translate(800, 600)">
              <path
                d="M 0 -20 L 6 -6 L 20 -6 L 8 2 L 12 16 L 0 8 L -12 16 L -8 2 L -20 -6 L -6 -6 Z"
                fill="#60a5fa"
                opacity="0.5"
              />
            </g>
            <g transform="translate(250, 700)">
              <path
                d="M 0 -15 L 4.5 -4.5 L 15 -4.5 L 6 1.5 L 9 12 L 0 6 L -9 12 L -6 1.5 L -15 -4.5 L -4.5 -4.5 Z"
                fill="#2563eb"
                opacity="0.4"
              />
            </g>

            {/* Celebration dots */}
            <circle cx="600" cy="250" r="12" fill="#2563eb" opacity="0.4" />
            <circle cx="650" cy="280" r="10" fill="#3b82f6" opacity="0.4" />
            <circle cx="700" cy="240" r="8" fill="#60a5fa" opacity="0.4" />
            <circle cx="750" cy="270" r="14" fill="#2563eb" opacity="0.4" />

            {/* Calendar pages */}
            <g transform="translate(1000, 600)">
              <rect
                x="0"
                y="0"
                width="80"
                height="100"
                fill="#f5f5f7"
                stroke="#2563eb"
                strokeWidth="2"
                rx="4"
                opacity="0.6"
              />
              <line
                x1="0"
                y1="30"
                x2="80"
                y2="30"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.5"
              />
              <circle cx="40" cy="65" r="8" fill="#2563eb" opacity="0.5" />
              <path
                d="M 0 30 Q 40 45 80 30"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                opacity="0.4"
              />
            </g>
          </svg>
        </Box>

        <Container
          sx={{
            py: { xs: 4, md: 6 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            zIndex: 1,
          }}
        >
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
            <Box
              sx={{
                mt: 2,
                "& .fc": {
                  fontFamily: "inherit",
                },
                "& .fc-header-toolbar": {
                  padding: "1rem",
                },
                "& .fc-button": {
                  backgroundColor: "#1e3a8a",
                  borderColor: "#1e3a8a",
                  "&:hover": {
                    backgroundColor: "#2563eb",
                    borderColor: "#2563eb",
                  },
                },
                "& .fc-button-active": {
                  backgroundColor: "#1e40af",
                  borderColor: "#1e40af",
                },
                "& .fc-today-button": {
                  backgroundColor: "#2563eb",
                  borderColor: "#2563eb",
                },
              }}
            >
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={calendarEvents}
                eventClick={(info) => {
                  const eventData = events.find((e) => e.id === info.event.id);
                  if (eventData) {
                    setSelectedEvent(eventData);
                    setDialogOpen(true);
                  }
                }}
                height="auto"
                eventDisplay="block"
                editable={false}
                selectable={false}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <EventDetailDialog
        open={dialogOpen}
        event={selectedEvent}
        onClose={() => {
          setDialogOpen(false);
          setSelectedEvent(null);
        }}
      />
    </>
  );
};
