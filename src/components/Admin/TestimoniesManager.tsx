import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { testimoniesService } from "../../services/testimoniesService";
import type { Testimony } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";

type FilterType = "all" | "featured" | "approved" | "pending";

export const TestimoniesManager = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);

  useEffect(() => {
    loadTestimonies();
  }, []);

  const loadTestimonies = async () => {
    try {
      const data = await testimoniesService.getAll();
      setTestimonies(data);
    } catch (error) {
      console.error("Error loading testimonies:", error);
      alert("Failed to load testimonies");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (testimony: Testimony) => {
    setSelectedTestimony(testimony);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTestimony(null);
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await testimoniesService.toggleFeatured(id);
      loadTestimonies();
    } catch (error) {
      console.error("Error toggling featured:", error);
      alert("Failed to update featured status");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await testimoniesService.approve(id);
      loadTestimonies();
    } catch (error) {
      console.error("Error approving testimony:", error);
      alert("Failed to approve testimony");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await testimoniesService.reject(id);
      loadTestimonies();
    } catch (error) {
      console.error("Error rejecting testimony:", error);
      alert("Failed to reject testimony");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;
    try {
      await testimoniesService.delete(id);
      loadTestimonies();
    } catch (error) {
      console.error("Error deleting testimony:", error);
      alert("Failed to delete testimony");
    }
  };

  const handleEditDisplayOrder = (testimony: Testimony) => {
    setSelectedTestimony(testimony);
    setEditDisplayOrder(testimony.display_order);
    setEditDialogOpen(true);
  };

  const handleSaveDisplayOrder = async () => {
    if (!selectedTestimony) return;
    try {
      await testimoniesService.update(selectedTestimony.id, {
        display_order: editDisplayOrder,
      });
      setEditDialogOpen(false);
      setSelectedTestimony(null);
      loadTestimonies();
    } catch (error) {
      console.error("Error updating display order:", error);
      alert("Failed to update display order");
    }
  };

  const filteredTestimonies = (() => {
    switch (filterType) {
      case "featured":
        return testimonies.filter((t) => t.is_featured);
      case "approved":
        return testimonies.filter((t) => t.is_approved);
      case "pending":
        return testimonies.filter((t) => !t.is_approved);
      default:
        return testimonies;
    }
  })();

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Testimonies Management</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            label="Filter"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="featured">Featured</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Author</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTestimonies.map((testimony) => (
              <TableRow key={testimony.id}>
                <TableCell>{testimony.author_name}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {truncateContent(testimony.content, 80)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleFeatured(testimony.id)}
                    color={testimony.is_featured ? "primary" : "default"}
                  >
                    {testimony.is_featured ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  {testimony.is_approved ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Approved"
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<CancelIcon />}
                      label="Pending"
                      color="warning"
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleEditDisplayOrder(testimony)}
                  >
                    {testimony.display_order}
                  </Button>
                </TableCell>
                <TableCell>
                  {new Date(testimony.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleView(testimony)}
                    title="View"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  {!testimony.is_approved && (
                    <IconButton
                      size="small"
                      onClick={() => handleApprove(testimony.id)}
                      color="success"
                      title="Approve"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                  {testimony.is_approved && (
                    <IconButton
                      size="small"
                      onClick={() => handleReject(testimony.id)}
                      color="warning"
                      title="Reject"
                    >
                      <CancelIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(testimony.id)}
                    color="error"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Testimony Details</DialogTitle>
        <DialogContent>
          {selectedTestimony && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Author: <strong>{selectedTestimony.author_name}</strong>
              </Typography>
              {selectedTestimony.author_email && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email: <strong>{selectedTestimony.author_email}</strong>
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 2, my: 2 }}>
                <Chip
                  label={
                    selectedTestimony.is_featured ? "Featured" : "Not Featured"
                  }
                  color={selectedTestimony.is_featured ? "primary" : "default"}
                  icon={
                    selectedTestimony.is_featured ? (
                      <StarIcon />
                    ) : (
                      <StarBorderIcon />
                    )
                  }
                  size="small"
                />
                <Chip
                  label={selectedTestimony.is_approved ? "Approved" : "Pending"}
                  color={selectedTestimony.is_approved ? "success" : "warning"}
                  size="small"
                />
                <Chip
                  label={`Order: ${selectedTestimony.display_order}`}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date:{" "}
                <strong>
                  {new Date(selectedTestimony.created_at).toLocaleString()}
                </strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                <strong>Testimony:</strong>
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  whiteSpace: "pre-wrap",
                  fontStyle: "italic",
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 1,
                }}
              >
                "{selectedTestimony.content}"
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Display Order Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Display Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Display Order"
            value={editDisplayOrder}
            onChange={(e) => setEditDisplayOrder(parseInt(e.target.value) || 0)}
            margin="normal"
            helperText="Lower numbers appear first in the slider"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDisplayOrder} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
