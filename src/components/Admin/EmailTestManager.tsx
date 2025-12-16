import EmailIcon from "@mui/icons-material/Email";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { emailTestService } from "../../services/emailTestService";

// Email template types
const EMAIL_TEMPLATE_TYPES = [
  { value: "donation", label: "Donation" },
  { value: "contact-submission", label: "Contact Submission" },
  { value: "department-join-request", label: "Department Join Request" },
  { value: "ministry-join-request", label: "Ministry Join Request" },
  { value: "prayer-request", label: "Prayer Request" },
  { value: "suggestion", label: "Suggestion" },
  { value: "support-request", label: "Support Request" },
  { value: "testimony-request", label: "Testimony Request" },
];

// Test data for each template type (reused from preview-email.ts)
const PREVIEW_PROPS: Record<string, Record<string, unknown>> = {
  donation: {
    amount: "100.00",
    category_name: "Tithe",
    donor_name: "John Doe",
    donor_email: "[email protected]",
    etransfer_email: "[email protected]",
    status: "Pending",
    notes: "Monthly tithe",
    created_at: "2024-01-01 12:00:00",
  },
  "contact-submission": {
    name: "John Doe",
    email: "[email protected]",
    message: "This is a test message from the contact form.",
    created_at: "2024-01-01 12:00:00",
  },
  "department-join-request": {
    department_name: "Worship",
    member_name: "John Doe",
    member_email: "[email protected]",
    member_phone: "+1234567890",
    created_at: "2024-01-01 12:00:00",
  },
  "ministry-join-request": {
    ministry_name: "Youth Ministry",
    member_name: "John Doe",
    member_email: "[email protected]",
    member_phone: "+1234567890",
    created_at: "2024-01-01 12:00:00",
  },
  "prayer-request": {
    name: "John Doe",
    email: "[email protected]",
    phone: "+1234567890",
    content: "Please pray for healing and strength during this difficult time.",
    created_at: "2024-01-01 12:00:00",
  },
  suggestion: {
    category_name: "Worship",
    submitter_name: "John Doe",
    submitter_phone: "+1234567890",
    suggestion_text:
      "I suggest we add more contemporary worship songs to our repertoire.",
    created_at: "2024-01-01 12:00:00",
  },
  "support-request": {
    name: "John Doe",
    email: "[email protected]",
    phone: "+1234567890",
    content: "I need assistance with accessing the church resources online.",
    created_at: "2024-01-01 12:00:00",
  },
  "testimony-request": {
    name: "John Doe",
    email: "[email protected]",
    phone: "+1234567890",
    content:
      "I want to share how the church has transformed my life and brought me closer to God.",
    created_at: "2024-01-01 12:00:00",
  },
};

export const EmailTestManager = () => {
  const [templateType, setTemplateType] = useState<string>("");
  const [testRecipient, setTestRecipient] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async () => {
    if (!templateType) {
      setError("Please select a template type");
      return;
    }

    if (!testRecipient || !testRecipient.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const eventData = PREVIEW_PROPS[templateType] || {};
      const result = await emailTestService.sendTestEmail({
        eventType: templateType,
        eventData,
        testRecipient,
      });

      if (result.success) {
        setSuccess(`Test email sent successfully to ${testRecipient}`);
        setTestRecipient("");
        setTemplateType("");
      } else {
        setError(result.error || "Failed to send test email");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while sending the test email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <EmailIcon fontSize="large" color="primary" />
        <Typography variant="h5">Email Testing Utility</Typography>
      </Box>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Send test emails to verify email templates are working correctly. Select
          a template type and provide a recipient email address.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        <FormControl fullWidth margin="normal">
          <InputLabel>Email Template Type</InputLabel>
          <Select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            label="Email Template Type"
            disabled={loading}
          >
            {EMAIL_TEMPLATE_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Test Recipient Email"
          type="email"
          value={testRecipient}
          onChange={(e) => setTestRecipient(e.target.value)}
          margin="normal"
          placeholder="[email protected]"
          disabled={loading}
          helperText="The email address where the test email will be sent"
        />

        <Box mt={3}>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={loading || !templateType || !testRecipient}
            fullWidth
          >
            {loading ? "Sending..." : "Send Test Email"}
          </Button>
        </Box>

        {templateType && (
          <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
            <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
              Preview Data:
            </Typography>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(PREVIEW_PROPS[templateType], null, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

