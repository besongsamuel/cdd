import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { requestsService } from '../services/requestsService';
import type { RequestType } from '../types';

export const RequestsPage = () => {
  const [formData, setFormData] = useState({
    type: 'prayer' as RequestType,
    name: '',
    email: '',
    phone: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!formData.content.trim()) {
      setError('Please enter your request message');
      setLoading(false);
      return;
    }

    // Email validation if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
    }

    try {
      await requestsService.create(formData);
      setSuccess(true);
      setFormData({
        type: 'prayer',
        name: '',
        email: '',
        phone: '',
        content: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTypeChange = (e: any) => {
    setFormData({
      ...formData,
      type: e.target.value as RequestType,
    });
  };

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Submit a Request
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Share your prayer requests, support needs, or testimonies with us
      </Typography>

      <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Request Type</InputLabel>
              <Select
                value={formData.type}
                onChange={handleTypeChange}
                label="Request Type"
              >
                <MenuItem value="prayer">Prayer Request</MenuItem>
                <MenuItem value="support">Support Request</MenuItem>
                <MenuItem value="testimony">Testimony Request</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone (Optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Message"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              multiline
              rows={6}
              margin="normal"
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Thank you for your request! We'll be in touch soon.
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

