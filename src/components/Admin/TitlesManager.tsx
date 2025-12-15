import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
import { titlesService } from "../../services/titlesService";
import type { Title } from "../../types";

export const TitlesManager = () => {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    display_order: 0,
  });

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      const data = await titlesService.getAll();
      setTitles(data);
    } catch (error) {
      console.error("Error loading titles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (title?: Title) => {
    if (title) {
      setEditingTitle(title);
      setFormData({
        name: title.name,
        display_order: title.display_order,
      });
    } else {
      setEditingTitle(null);
      setFormData({
        name: "",
        display_order: titles.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTitle(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTitle) {
        await titlesService.update(editingTitle.id, formData);
      } else {
        await titlesService.create(formData);
      }
      handleCloseDialog();
      loadTitles();
    } catch (error) {
      console.error("Error saving title:", error);
      alert("Failed to save title");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this title?")) return;
    try {
      await titlesService.delete(id);
      loadTitles();
    } catch (error) {
      console.error("Error deleting title:", error);
      alert("Failed to delete title");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newTitles = [...titles];
    const temp = newTitles[index].display_order;
    newTitles[index].display_order = newTitles[index - 1].display_order;
    newTitles[index - 1].display_order = temp;

    try {
      await titlesService.reorder(
        newTitles.map((t) => ({ id: t.id, display_order: t.display_order }))
      );
      loadTitles();
    } catch (error) {
      console.error("Error reordering titles:", error);
      alert("Failed to reorder titles");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === titles.length - 1) return;
    const newTitles = [...titles];
    const temp = newTitles[index].display_order;
    newTitles[index].display_order = newTitles[index + 1].display_order;
    newTitles[index + 1].display_order = temp;

    try {
      await titlesService.reorder(
        newTitles.map((t) => ({ id: t.id, display_order: t.display_order }))
      );
      loadTitles();
    } catch (error) {
      console.error("Error reordering titles:", error);
      alert("Failed to reorder titles");
    }
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
        <Typography variant="h5">Titles Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Title
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {titles.map((title, index) => (
              <TableRow key={title.id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2">{title.display_order}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === titles.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>{title.name}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(title)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(title.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTitle ? "Edit Title" : "Add Title"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Display Order"
            type="number"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


