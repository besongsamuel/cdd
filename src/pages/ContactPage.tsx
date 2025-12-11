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
import { useTranslation } from 'react-i18next';
import { contactService } from '../services/contactService';
import { SEO } from '../components/SEO';
import { CHURCH_ADDRESS, CHURCH_PHONE, CHURCH_PROVINCE } from '../utils/constants';

export const ContactPage = () => {
  const { t } = useTranslation('contact');
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
      setError(t('form.error'));
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('form.error'));
      setLoading(false);
      return;
    }

    try {
      await contactService.create(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('form.error'));
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
    <>
      <SEO title={t('title')} description={t('getInTouch')} url="/contact" />
      <Container sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom textAlign="center">
          {t('title')}
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
            {t('getInTouch')}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('form.name')}
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('form.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('form.message')}
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
                {t('form.success')}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? t('form.sending') : t('form.sendMessage')}
            </Button>
          </form>
        </Paper>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {t('visitUs')}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" gutterBottom>
                <strong>{t('address')}:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {CHURCH_ADDRESS}
              </Typography>

              <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                <strong>{t('phone')}:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {CHURCH_PHONE}
              </Typography>

              <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                <strong>{t('province')}:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {CHURCH_PROVINCE}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
    </>
  );
};

