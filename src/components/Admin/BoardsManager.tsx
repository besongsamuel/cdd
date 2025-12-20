import AddIcon from "@mui/icons-material/Add";
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
  Switch,
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
import { messageBoardsService } from "../../services/messageBoardsService";
import type { BoardAccessType, MessageBoard } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";

export const BoardsManager = () => {
  const [boards, setBoards] = useState<MessageBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<MessageBoard | null>(null);

  const [boardForm, setBoardForm] = useState({
    name: "",
    description: "",
    is_public: false,
    access_type: "authenticated" as BoardAccessType,
    pinned_announcement: "",
    display_order: 0,
  });

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await messageBoardsService.getAll();
      setBoards(data);
    } catch (error) {
      console.error("Error loading boards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (board?: MessageBoard) => {
    if (board) {
      setEditingBoard(board);
      setBoardForm({
        name: board.name,
        description: board.description || "",
        is_public: board.is_public,
        access_type: board.access_type,
        pinned_announcement: board.pinned_announcement || "",
        display_order: board.display_order,
      });
    } else {
      setEditingBoard(null);
      setBoardForm({
        name: "",
        description: "",
        is_public: false,
        access_type: "authenticated",
        pinned_announcement: "",
        display_order: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBoard(null);
  };

  const handleSave = async () => {
    try {
      if (editingBoard) {
        await messageBoardsService.update(editingBoard.id, boardForm);
      } else {
        await messageBoardsService.create(boardForm);
      }
      await loadBoards();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving board:", error);
      alert("Failed to save board. Please try again.");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this board?")) return;

    try {
      await messageBoardsService.archive(id);
      await loadBoards();
    } catch (error) {
      console.error("Error archiving board:", error);
      alert("Failed to archive board. Please try again.");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Message Boards</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Board
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Access</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No boards yet. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              boards.map((board) => (
                <TableRow key={board.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{board.name}</Typography>
                    {board.description && (
                      <Typography variant="caption" color="text.secondary">
                        {board.description.substring(0, 50)}
                        {board.description.length > 50 ? "..." : ""}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={board.is_public ? "Public" : "Private"}
                      size="small"
                      color={board.is_public ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={board.access_type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{board.display_order}</TableCell>
                  <TableCell>
                    {board.archived_at ? (
                      <Chip label="Archived" size="small" color="default" />
                    ) : (
                      <Chip label="Active" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(board)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleArchive(board.id)}
                      color="error"
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBoard ? "Edit Board" : "Create New Board"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Board Name"
              fullWidth
              value={boardForm.name}
              onChange={(e) =>
                setBoardForm({ ...boardForm, name: e.target.value })
              }
              required
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={boardForm.description}
              onChange={(e) =>
                setBoardForm({ ...boardForm, description: e.target.value })
              }
            />

            <FormControl fullWidth>
              <InputLabel>Access Type</InputLabel>
              <Select
                value={boardForm.access_type}
                label="Access Type"
                onChange={(e) =>
                  setBoardForm({
                    ...boardForm,
                    access_type: e.target.value as BoardAccessType,
                  })
                }
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="authenticated">Authenticated</MenuItem>
                <MenuItem value="role_based">Role Based</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="ministry">Ministry</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={boardForm.is_public}
                onChange={(e) =>
                  setBoardForm({ ...boardForm, is_public: e.target.checked })
                }
              />
              <Typography>Public Board</Typography>
            </Box>

            <TextField
              label="Pinned Announcement (optional)"
              fullWidth
              multiline
              rows={2}
              value={boardForm.pinned_announcement}
              onChange={(e) =>
                setBoardForm({
                  ...boardForm,
                  pinned_announcement: e.target.value,
                })
              }
              helperText="This will be displayed at the top of the board"
            />

            <TextField
              label="Display Order"
              type="number"
              fullWidth
              value={boardForm.display_order}
              onChange={(e) =>
                setBoardForm({
                  ...boardForm,
                  display_order: parseInt(e.target.value) || 0,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!boardForm.name.trim()}
          >
            {editingBoard ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
