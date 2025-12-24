import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { requestsService } from '../../services/requestsService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Request, RequestType, RequestStatus } from '../../types';

export const RequestsManager = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<RequestType | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await requestsService.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (request: Request) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    try {
      await requestsService.updateStatus(id, status);
      loadRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      await requestsService.delete(id);
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  const filteredRequests = filterType === 'all'
    ? requests
    : requests.filter((r) => r.type === filterType);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Requests Management</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RequestType | 'all')}
            label="Filter by Type"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="prayer">Prayer</MenuItem>
            <MenuItem value="support">Support</MenuItem>
            <MenuItem value="testimony">Testimony</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Chip label={request.type} size="small" />
                </TableCell>
                <TableCell>{request.name || '-'}</TableCell>
                <TableCell>{request.email || '-'}</TableCell>
                <TableCell>
                  <Select
                    value={request.status}
                    onChange={(e) => handleStatusChange(request.id, e.target.value as RequestStatus)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleView(request)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(request.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: <strong>{selectedRequest.type}</strong>
              </Typography>
              {selectedRequest.name && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Name: <strong>{selectedRequest.name}</strong>
                </Typography>
              )}
              {selectedRequest.email && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email: <strong>{selectedRequest.email}</strong>
                </Typography>
              )}
              {selectedRequest.phone && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Phone: <strong>{selectedRequest.phone}</strong>
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status: <Chip label={selectedRequest.status} size="small" color={getStatusColor(selectedRequest.status)} />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: <strong>{new Date(selectedRequest.created_at).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                <strong>Message:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {selectedRequest.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};







