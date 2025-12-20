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
import { useTranslation } from "react-i18next";
import { messageBoardsService } from "../../services/messageBoardsService";
import type { BoardAccessType, MessageBoard } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";

export const BoardsManager = () => {
  const { t } = useTranslation("messageBoards");
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
      alert(t("admin.failedToSaveBoard"));
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm(t("admin.archiveConfirm"))) return;

    try {
      await messageBoardsService.archive(id);
      await loadBoards();
    } catch (error) {
      console.error("Error archiving board:", error);
      alert(t("admin.failedToArchiveBoard"));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">{t("admin.title")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t("admin.newBoard")}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("admin.name")}</TableCell>
              <TableCell>{t("admin.type")}</TableCell>
              <TableCell>{t("admin.access")}</TableCell>
              <TableCell>{t("admin.order")}</TableCell>
              <TableCell>{t("admin.status")}</TableCell>
              <TableCell align="right">{t("admin.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {t("admin.noBoardsYet")}
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
                      label={board.is_public ? t("public") : t("private")}
                      size="small"
                      color={board.is_public ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(`accessTypes.${board.access_type}`)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{board.display_order}</TableCell>
                  <TableCell>
                    {board.archived_at ? (
                      <Chip
                        label={t("admin.archived")}
                        size="small"
                        color="default"
                      />
                    ) : (
                      <Chip
                        label={t("admin.active")}
                        size="small"
                        color="success"
                      />
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
          {editingBoard ? t("admin.editBoard") : t("admin.createNewBoard")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("admin.boardName")}
              fullWidth
              value={boardForm.name}
              onChange={(e) =>
                setBoardForm({ ...boardForm, name: e.target.value })
              }
              required
            />

            <TextField
              label={t("admin.description")}
              fullWidth
              multiline
              rows={3}
              value={boardForm.description}
              onChange={(e) =>
                setBoardForm({ ...boardForm, description: e.target.value })
              }
            />

            <FormControl fullWidth>
              <InputLabel>{t("admin.accessType")}</InputLabel>
              <Select
                value={boardForm.access_type}
                label={t("admin.accessType")}
                onChange={(e) =>
                  setBoardForm({
                    ...boardForm,
                    access_type: e.target.value as BoardAccessType,
                  })
                }
              >
                <MenuItem value="public">{t("accessTypes.public")}</MenuItem>
                <MenuItem value="authenticated">
                  {t("accessTypes.authenticated")}
                </MenuItem>
                <MenuItem value="role_based">
                  {t("accessTypes.role_based")}
                </MenuItem>
                <MenuItem value="department">
                  {t("accessTypes.department")}
                </MenuItem>
                <MenuItem value="ministry">
                  {t("accessTypes.ministry")}
                </MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Switch
                checked={boardForm.is_public}
                onChange={(e) =>
                  setBoardForm({ ...boardForm, is_public: e.target.checked })
                }
              />
              <Typography>{t("admin.publicBoard")}</Typography>
            </Box>

            <TextField
              label={t("admin.pinnedAnnouncement")}
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
              helperText={t("admin.pinnedAnnouncementHelper")}
            />

            <TextField
              label={t("admin.displayOrder")}
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
          <Button onClick={handleCloseDialog}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!boardForm.name.trim()}
          >
            {editingBoard ? t("admin.update") : t("admin.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
