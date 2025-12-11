import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { contactService } from '../services/contactService';
import { CHURCH_ADDRESS, CHURCH_PHONE, CHURCH_PROVINCE } from '../utils/constants';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
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
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await contactService.create(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
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

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Contact Us
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 4,
          mt: 2,
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Get in Touch
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Message"
              name="message"
              value={formData.message}
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
                Thank you for your message! We'll get back to you soon.
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Paper>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Visit Us
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Address:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {CHURCH_ADDRESS}
              </Typography>

              <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                <strong>Phone:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {CHURCH_PHONE}
              </Typography>

              <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                <strong>Province:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {CHURCH_PROVINCE}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

