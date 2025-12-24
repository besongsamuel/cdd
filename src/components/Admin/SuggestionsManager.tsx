import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
import { LoadingSpinner } from "../common/LoadingSpinner";
import { suggestionsService } from "../../services/suggestionsService";
import { suggestionCategoriesService } from "../../services/suggestionCategoriesService";
import type { Suggestion, SuggestionCategory } from "../../types";

export const SuggestionsManager = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [categories, setCategories] = useState<SuggestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] =
    useState<Suggestion | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [formData, setFormData] = useState({
    status: "",
    notes: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSuggestions(), loadCategories()]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await suggestionsService.getAll();
      setSuggestions(data);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await suggestionCategoriesService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleOpenDialog = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setFormData({
      status: suggestion.status,
      notes: suggestion.notes || "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSuggestion(null);
  };

  const handleSave = async () => {
    if (!editingSuggestion) return;
    try {
      await suggestionsService.updateStatus(
        editingSuggestion.id,
        formData.status,
        formData.notes
      );
      handleCloseDialog();
      loadSuggestions();
    } catch (error) {
      console.error("Error updating suggestion:", error);
      alert("Failed to update suggestion");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
    try {
      await suggestionsService.delete(id);
      loadSuggestions();
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      alert("Failed to delete suggestion");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterCategory !== "all") {
      if (filterCategory === "none" && s.category_id) return false;
      if (filterCategory !== "none" && s.category_id !== filterCategory)
        return false;
    }
    return true;
  });

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
        <Typography variant="h5">Suggestions Management</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="none">No Category</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Suggestion</TableCell>
              <TableCell>Submitter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuggestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No suggestions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell>
                    {suggestion.category_name || suggestion.custom_category || "-"}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {suggestion.suggestion_text}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {suggestion.submitter_name || "-"}
                    {suggestion.submitter_phone && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {suggestion.submitter_phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={suggestion.status}
                      color={getStatusColor(suggestion.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(suggestion.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(suggestion)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(suggestion.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Suggestion</DialogTitle>
        <DialogContent>
          {editingSuggestion && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Category:</strong>{" "}
                {editingSuggestion.category_name ||
                  editingSuggestion.custom_category ||
                  "None"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Submitter:</strong>{" "}
                {editingSuggestion.submitter_name || "Anonymous"}
                {editingSuggestion.submitter_phone && (
                  <> ({editingSuggestion.submitter_phone})</>
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Date:</strong>{" "}
                {new Date(editingSuggestion.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                <strong>Suggestion:</strong>
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  p: 1,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  whiteSpace: "pre-wrap",
                }}
              >
                {editingSuggestion.suggestion_text}
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                margin="normal"
                multiline
                rows={4}
                placeholder="Add any notes about this suggestion..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};





