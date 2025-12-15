import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { eventsService } from '../../services/eventsService';
import { regularProgramsService } from '../../services/regularProgramsService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Event, RegularProgram } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`events-programs-tabpanel-${index}`}
      aria-labelledby={`events-programs-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const EventsManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [programs, setPrograms] = useState<RegularProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'event' | 'program'>('event');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingProgram, setEditingProgram] = useState<RegularProgram | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
  });
  const [programFormData, setProgramFormData] = useState({
    day: '',
    time: '',
    location: '',
    description: '',
    order: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadEvents(), loadPrograms()]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await regularProgramsService.getAll();
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenEventDialog = (event?: Event) => {
    setDialogType('event');
    if (event) {
      setEditingEvent(event);
      setEventFormData({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        event_time: event.event_time || '',
        location: event.location || '',
      });
    } else {
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
      });
    }
    setDialogOpen(true);
  };

  const handleOpenProgramDialog = (program?: RegularProgram) => {
    setDialogType('program');
    if (program) {
      setEditingProgram(program);
      setProgramFormData({
        day: program.day,
        time: program.time,
        location: program.location,
        description: program.description,
        order: program.order,
      });
    } else {
      setEditingProgram(null);
      setProgramFormData({
        day: '',
        time: '',
        location: '',
        description: '',
        order: programs.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setEditingProgram(null);
  };

  const handleSubmitEvent = async () => {
    try {
      if (editingEvent) {
        await eventsService.update(editingEvent.id, eventFormData);
      } else {
        await eventsService.create(eventFormData);
      }
      handleCloseDialog();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };

  const handleSubmitProgram = async () => {
    try {
      if (editingProgram) {
        await regularProgramsService.update(editingProgram.id, programFormData);
      } else {
        await regularProgramsService.create(programFormData);
      }
      handleCloseDialog();
      loadPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Failed to save program');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventsService.delete(id);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      await regularProgramsService.delete(id);
      loadPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Events & Programs Management
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Events" />
        <Tab label="Regular Programs" />
      </Tabs>

      {/* Events Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenEventDialog()}
          >
            Add Event
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>
                    {new Date(event.event_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{event.event_time || "-"}</TableCell>
                  <TableCell>{event.location || "-"}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEventDialog(event)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Programs Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenProgramDialog()}
          >
            Add Program
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>{program.day}</TableCell>
                  <TableCell>{program.time}</TableCell>
                  <TableCell>{program.location}</TableCell>
                  <TableCell>
                    {program.description.length > 50
                      ? program.description.substring(0, 50) + "..."
                      : program.description}
                  </TableCell>
                  <TableCell>{program.order}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenProgramDialog(program)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProgram(program.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Event Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "event"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEvent ? "Edit Event" : "Add Event"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={eventFormData.title}
            onChange={(e) =>
              setEventFormData({ ...eventFormData, title: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={eventFormData.description}
            onChange={(e) =>
              setEventFormData({
                ...eventFormData,
                description: e.target.value,
              })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={eventFormData.event_date}
            onChange={(e) =>
              setEventFormData({
                ...eventFormData,
                event_date: e.target.value,
              })
            }
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            value={eventFormData.event_time}
            onChange={(e) =>
              setEventFormData({
                ...eventFormData,
                event_time: e.target.value,
              })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Location"
            value={eventFormData.location}
            onChange={(e) =>
              setEventFormData({ ...eventFormData, location: e.target.value })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmitEvent} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Program Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "program"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProgram ? "Edit Program" : "Add Program"}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Day</InputLabel>
            <Select
              value={programFormData.day}
              onChange={(e) =>
                setProgramFormData({
                  ...programFormData,
                  day: e.target.value,
                })
              }
              label="Day"
            >
              <MenuItem value="Sunday">Sunday</MenuItem>
              <MenuItem value="Monday">Monday</MenuItem>
              <MenuItem value="Tuesday">Tuesday</MenuItem>
              <MenuItem value="Wednesday">Wednesday</MenuItem>
              <MenuItem value="Thursday">Thursday</MenuItem>
              <MenuItem value="Friday">Friday</MenuItem>
              <MenuItem value="Saturday">Saturday</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Time"
            value={programFormData.time}
            onChange={(e) =>
              setProgramFormData({
                ...programFormData,
                time: e.target.value,
              })
            }
            margin="normal"
            required
            placeholder="e.g., 10:00 AM"
          />
          <TextField
            fullWidth
            label="Location"
            value={programFormData.location}
            onChange={(e) =>
              setProgramFormData({
                ...programFormData,
                location: e.target.value,
              })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={programFormData.description}
            onChange={(e) =>
              setProgramFormData({
                ...programFormData,
                description: e.target.value,
              })
            }
            margin="normal"
            required
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Display Order"
            type="number"
            value={programFormData.order}
            onChange={(e) =>
              setProgramFormData({
                ...programFormData,
                order: parseInt(e.target.value) || 0,
              })
            }
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmitProgram} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



