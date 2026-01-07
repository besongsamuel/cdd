import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { membersService } from "../../services/membersService";
import { ministriesService } from "../../services/ministriesService";
import { ministryJoinRequestsService } from "../../services/ministryJoinRequestsService";
import { ministryMembersService } from "../../services/ministryMembersService";
import { outreachEventsService } from "../../services/outreachEventsService";
import { outreachGalleryService } from "../../services/outreachGalleryService";
import { roleService } from "../../services/roleService";
import type {
  DepartmentRequestStatus,
  Member,
  Ministry,
  MinistryJoinRequest,
  MinistryMember,
  OutreachEvent,
  OutreachGalleryPhoto,
} from "../../types";
import { ImageUpload } from "../common/ImageUpload";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { MarkdownEditor } from "../common/MarkdownEditor";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ministries-tabpanel-${index}`}
      aria-labelledby={`ministries-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const MinistriesManager = () => {
  const { currentMember, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [filteredMinistries, setFilteredMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [ministryMembers, setMinistryMembers] = useState<MinistryMember[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<MinistryJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "ministry" | "member" | "request" | "outreach-event" | "outreach-gallery"
  >("ministry");
  const [editingItem, setEditingItem] = useState<
    Ministry | MinistryJoinRequest | OutreachEvent | null
  >(null);
  const [outreachEvents, setOutreachEvents] = useState<OutreachEvent[]>([]);
  const [outreachGalleryPhotos, setOutreachGalleryPhotos] = useState<OutreachGalleryPhoto[]>([]);
  const [selectedOutreachEventId, setSelectedOutreachEventId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    DepartmentRequestStatus | "all"
  >("all");

  const [ministryForm, setMinistryForm] = useState({
    name: "",
    description: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  const [requestNotes, setRequestNotes] = useState("");
  const [requestAction, setRequestAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [isMinistryLead, setIsMinistryLead] = useState(false);
  const [outreachEventForm, setOutreachEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
  });
  const [outreachGalleryForm, setOutreachGalleryForm] = useState({
    image_url: "" as string | string[],
    caption: "",
    taken_at: "",
  });
  const [editingGalleryPhoto, setEditingGalleryPhoto] = useState<OutreachGalleryPhoto | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (currentMember && ministries.length > 0) {
      checkUserPermissions();
    }
  }, [currentMember, isAdmin, ministries]);

  useEffect(() => {
    if (tabValue === 1) {
      loadMembers();
      loadAllMembers();
      checkMinistryLeadStatus();
    } else if (tabValue === 2) {
      loadJoinRequests();
    } else if (tabValue === 3) {
      loadOutreachEvents();
    }
  }, [tabValue, selectedMinistryId, currentMember]);

  useEffect(() => {
    if (selectedOutreachEventId && tabValue === 3) {
      loadOutreachGallery();
    }
  }, [selectedOutreachEventId, tabValue]);

  const checkMinistryLeadStatus = async () => {
    if (!currentMember || !selectedMinistryId) {
      setIsMinistryLead(false);
      return;
    }
    try {
      const isLead = await roleService.isMinistryLead(
        selectedMinistryId,
        currentMember.id
      );
      setIsMinistryLead(isLead);
    } catch (error) {
      console.error("Error checking ministry lead status:", error);
      setIsMinistryLead(false);
    }
  };

  const checkUserPermissions = async () => {
    if (!currentMember || ministries.length === 0) return;

    if (isAdmin) {
      // Admin sees all ministries
      setFilteredMinistries(ministries);
    } else {
      // Non-admin: check if they're a ministry lead
      const userMinistries = await roleService.getUserMinistries(
        currentMember.id
      );
      setFilteredMinistries(userMinistries);

      // If they only have one ministry, auto-select it
      if (userMinistries.length === 1) {
        setSelectedMinistryId(userMinistries[0].id);
      }
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMinistries(),
        loadMembers(),
        loadAllMembers(),
        loadJoinRequests(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMinistries = async () => {
    try {
      const data = await ministriesService.getAll();
      setMinistries(data);
      // Set filtered ministries immediately - checkUserPermissions will update if needed
      setFilteredMinistries(data);
    } catch (error) {
      console.error("Error loading ministries:", error);
      setFilteredMinistries([]);
    }
  };

  const loadMembers = async () => {
    if (!selectedMinistryId) {
      setMinistryMembers([]);
      return;
    }
    try {
      const data =
        await ministryMembersService.getByMinistry(selectedMinistryId);
      setMinistryMembers(data);
    } catch (error) {
      console.error("Error loading ministry members:", error);
    }
  };

  const loadAllMembers = async () => {
    try {
      const data = await membersService.getAll();
      setAllMembers(data);
    } catch (error) {
      console.error("Error loading all members:", error);
    }
  };

  const loadJoinRequests = async () => {
    try {
      const data = await ministryJoinRequestsService.getAll();
      setJoinRequests(data);
    } catch (error) {
      console.error("Error loading join requests:", error);
    }
  };

  const loadOutreachEvents = async () => {
    if (!selectedMinistryId) {
      setOutreachEvents([]);
      return;
    }
    try {
      const data = await outreachEventsService.getByMinistry(selectedMinistryId);
      setOutreachEvents(data);
    } catch (error) {
      console.error("Error loading outreach events:", error);
    }
  };

  const loadOutreachGallery = async () => {
    if (!selectedOutreachEventId) {
      setOutreachGalleryPhotos([]);
      return;
    }
    try {
      const data = await outreachGalleryService.getByEvent(selectedOutreachEventId);
      setOutreachGalleryPhotos(data);
    } catch (error) {
      console.error("Error loading outreach gallery:", error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenMinistryDialog = (ministry?: Ministry) => {
    if (!isAdmin && ministry) {
      // Leads can't edit ministry details
      return;
    }

    setDialogType("ministry");
    setEditingItem(ministry || null);
    if (ministry) {
      setMinistryForm({
        name: ministry.name,
        description: ministry.description || "",
        image_url: ministry.image_url || "",
        display_order: ministry.display_order,
        is_active: ministry.is_active,
      });
    } else {
      setMinistryForm({
        name: "",
        description: "",
        image_url: "",
        display_order: ministries.length,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setEditingGalleryPhoto(null);
    setRequestNotes("");
  };

  const handleSaveMinistry = async () => {
    try {
      if (editingItem) {
        await ministriesService.update(editingItem.id, ministryForm);
      } else {
        await ministriesService.create(ministryForm);
      }
      handleCloseDialog();
      loadMinistries();
    } catch (error) {
      console.error("Error saving ministry:", error);
      alert(error instanceof Error ? error.message : "Error saving ministry");
    }
  };

  const handleDeleteMinistry = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this ministry?")) return;
    try {
      await ministriesService.delete(id);
      loadMinistries();
    } catch (error) {
      console.error("Error deleting ministry:", error);
      alert(error instanceof Error ? error.message : "Error deleting ministry");
    }
  };

  const handleAddMember = async (memberId: string) => {
    if (!selectedMinistryId) return;
    if (!canAddMembers) {
      alert("Only admins and ministry leads can add members to ministries");
      return;
    }
    try {
      await ministryMembersService.addMember(
        selectedMinistryId,
        memberId,
        false
      );
      loadMembers();
    } catch (error) {
      console.error("Error adding member:", error);
      alert(error instanceof Error ? error.message : "Error adding member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedMinistryId) return;
    if (!confirm("Remove this member from the ministry?")) return;
    try {
      await ministryMembersService.removeMember(selectedMinistryId, memberId);
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      alert(error instanceof Error ? error.message : "Error removing member");
    }
  };

  const handleToggleLead = async (
    memberId: string,
    currentLeadStatus: boolean
  ) => {
    if (!selectedMinistryId) return;
    if (!isAdmin) {
      // Leads can't change lead status
      return;
    }
    try {
      await ministryMembersService.setLead(
        selectedMinistryId,
        memberId,
        !currentLeadStatus
      );
      loadMembers();
    } catch (error) {
      console.error("Error updating lead status:", error);
      alert(
        error instanceof Error ? error.message : "Error updating lead status"
      );
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await ministryJoinRequestsService.updateStatus(
        requestId,
        "approved",
        requestNotes
      );
      handleCloseDialog();
      loadJoinRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error instanceof Error ? error.message : "Error approving request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await ministryJoinRequestsService.updateStatus(
        requestId,
        "rejected",
        requestNotes
      );
      handleCloseDialog();
      loadJoinRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error instanceof Error ? error.message : "Error rejecting request");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Delete this join request?")) return;
    try {
      await ministryJoinRequestsService.delete(id);
      loadJoinRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error instanceof Error ? error.message : "Error deleting request");
    }
  };

  const handleOpenOutreachEventDialog = (event?: OutreachEvent) => {
    if (!isAdmin) return;
    setDialogType("outreach-event");
    setEditingItem(event || null);
    if (event) {
      setOutreachEventForm({
        title: event.title,
        description: event.description || "",
        event_date: event.event_date,
        event_time: event.event_time || "",
        location: event.location || "",
      });
    } else {
      setOutreachEventForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSaveOutreachEvent = async () => {
    if (!selectedMinistryId) {
      alert("Please select a ministry first");
      return;
    }
    try {
      const eventData = {
        ministry_id: selectedMinistryId,
        title: outreachEventForm.title,
        description: outreachEventForm.description || undefined,
        event_date: outreachEventForm.event_date,
        event_time: outreachEventForm.event_time || undefined,
        location: outreachEventForm.location || undefined,
      };
      if (editingItem) {
        await outreachEventsService.update(editingItem.id, eventData);
      } else {
        await outreachEventsService.create(eventData);
      }
      handleCloseDialog();
      loadOutreachEvents();
    } catch (error) {
      console.error("Error saving outreach event:", error);
      alert(error instanceof Error ? error.message : "Error saving outreach event");
    }
  };

  const handleDeleteOutreachEvent = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this outreach event? All associated photos will also be deleted.")) return;
    try {
      await outreachEventsService.delete(id);
      loadOutreachEvents();
      if (selectedOutreachEventId === id) {
        setSelectedOutreachEventId("");
      }
    } catch (error) {
      console.error("Error deleting outreach event:", error);
      alert(error instanceof Error ? error.message : "Error deleting outreach event");
    }
  };

  const handleOpenGalleryDialog = (photo?: OutreachGalleryPhoto) => {
    if (!isAdmin) return;
    setDialogType("outreach-gallery");
    setEditingGalleryPhoto(photo || null);
    if (photo) {
      setOutreachGalleryForm({
        image_url: photo.image_url,
        caption: photo.caption || "",
        taken_at: photo.taken_at ? new Date(photo.taken_at).toISOString().split("T")[0] : "",
      });
    } else {
      setOutreachGalleryForm({
        image_url: [],
        caption: "",
        taken_at: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSaveGalleryPhoto = async () => {
    if (!selectedOutreachEventId) {
      alert("Please select an outreach event first");
      return;
    }
    try {
      const photoData = {
        outreach_event_id: selectedOutreachEventId,
        image_url: typeof outreachGalleryForm.image_url === "string" ? outreachGalleryForm.image_url : "",
        caption: outreachGalleryForm.caption || undefined,
        taken_at: outreachGalleryForm.taken_at || undefined,
      };
      if (editingGalleryPhoto) {
        await outreachGalleryService.update(editingGalleryPhoto.id, photoData);
      } else {
        await outreachGalleryService.create(photoData);
      }
      handleCloseDialog();
      loadOutreachGallery();
    } catch (error) {
      console.error("Error saving gallery photo:", error);
      alert(error instanceof Error ? error.message : "Error saving gallery photo");
    }
  };

  const handleBulkUploadGallery = async (urls: string[]) => {
    if (!selectedOutreachEventId) {
      alert("Please select an outreach event first");
      return;
    }
    try {
      const photos = urls.map((url) => ({
        outreach_event_id: selectedOutreachEventId,
        image_url: url,
        caption: outreachGalleryForm.caption || undefined,
        taken_at: outreachGalleryForm.taken_at || undefined,
      }));
      await outreachGalleryService.createMultiple(photos);
      loadOutreachGallery();
      alert(`Successfully uploaded ${urls.length} photos`);
    } catch (error) {
      console.error("Error bulk uploading photos:", error);
      alert("Failed to upload some photos");
    }
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      await outreachGalleryService.delete(id);
      loadOutreachGallery();
    } catch (error) {
      console.error("Error deleting gallery photo:", error);
      alert(error instanceof Error ? error.message : "Error deleting gallery photo");
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? joinRequests
      : joinRequests.filter((r) => r.status === filterStatus);

  const availableMembers = allMembers.filter(
    (m) => !ministryMembers.some((mm) => mm.member_id === m.id)
  );

  const canManageAll = isAdmin;
  const canAddMembers = isAdmin || isMinistryLead;

  if (loading && ministries.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Ministries Management
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Ministries" />
        <Tab label="Members" />
        <Tab label="Join Requests" />
        <Tab label="Outreach Events" />
      </Tabs>

      {/* Ministries Tab */}
      <TabPanel value={tabValue} index={0}>
        {canManageAll && (
          <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenMinistryDialog()}
            >
              Add Ministry
            </Button>
          </Box>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Active</TableCell>
                {canManageAll && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMinistries.map((ministry) => (
                <TableRow key={ministry.id}>
                  <TableCell>{ministry.name}</TableCell>
                  <TableCell>
                    {ministry.description
                      ? ministry.description.substring(0, 50) + "..."
                      : "-"}
                  </TableCell>
                  <TableCell>{ministry.display_order}</TableCell>
                  <TableCell>
                    <Chip
                      label={ministry.is_active ? "Active" : "Inactive"}
                      color={ministry.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  {canManageAll && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenMinistryDialog(ministry)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMinistry(ministry.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Members Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel>Select Ministry</InputLabel>
            <Select
              value={selectedMinistryId}
              onChange={(e) => setSelectedMinistryId(e.target.value)}
              label="Select Ministry"
              disabled={!canManageAll && filteredMinistries.length === 1}
            >
              {filteredMinistries.map((ministry) => (
                <MenuItem key={ministry.id} value={ministry.id}>
                  {ministry.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedMinistryId && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Current Members
              </Typography>
              {canAddMembers && availableMembers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Add Member:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {availableMembers.map((member) => (
                      <Chip
                        key={member.id}
                        label={member.name}
                        onClick={() => handleAddMember(member.id)}
                        clickable
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Lead</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ministryMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No members in this ministry
                      </TableCell>
                    </TableRow>
                  ) : (
                    ministryMembers.map((mm) => (
                      <TableRow key={mm.id}>
                        <TableCell>{mm.member_name || "Unknown"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={mm.is_lead}
                            onChange={() =>
                              handleToggleLead(mm.member_id, mm.is_lead)
                            }
                            size="small"
                            disabled={!canManageAll}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMember(mm.member_id)}
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
          </>
        )}
      </TabPanel>

      {/* Join Requests Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as DepartmentRequestStatus | "all"
                )
              }
              label="Filter by Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ministry</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No join requests
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.ministry_name || "-"}</TableCell>
                    <TableCell>{request.member_name}</TableCell>
                    <TableCell>{request.member_email || "-"}</TableCell>
                    <TableCell>{request.member_phone || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={
                          request.status === "approved"
                            ? "success"
                            : request.status === "rejected"
                              ? "error"
                              : "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingItem(request);
                              setDialogType("request");
                              setRequestNotes(request.notes || "");
                              setRequestAction("approve");
                              setDialogOpen(true);
                            }}
                          >
                            <CheckCircleIcon color="success" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingItem(request);
                              setDialogType("request");
                              setRequestNotes(request.notes || "");
                              setRequestAction("reject");
                              setDialogOpen(true);
                            }}
                          >
                            <CancelIcon color="error" />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRequest(request.id)}
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
      </TabPanel>

      {/* Ministry Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "ministry"}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Edit Ministry" : "Add Ministry"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={ministryForm.name}
            onChange={(e) =>
              setMinistryForm({ ...ministryForm, name: e.target.value })
            }
            margin="normal"
            required
          />
          <MarkdownEditor
            value={ministryForm.description}
            onChange={(value) =>
              setMinistryForm({
                ...ministryForm,
                description: value || "",
              })
            }
            label="Description (Markdown)"
            minHeight={300}
          />
          <ImageUpload
            mode="single"
            bucket="ministry-images"
            value={ministryForm.image_url}
            onChange={(url) =>
              setMinistryForm({ ...ministryForm, image_url: url as string })
            }
            label="Ministry Image"
          />
          <TextField
            fullWidth
            label="Display Order"
            type="number"
            value={ministryForm.display_order}
            onChange={(e) =>
              setMinistryForm({
                ...ministryForm,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={ministryForm.is_active}
                onChange={(e) =>
                  setMinistryForm({
                    ...ministryForm,
                    is_active: e.target.checked,
                  })
                }
              />
            }
            label="Active"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveMinistry} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Approval/Rejection Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "request"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem &&
          (editingItem as MinistryJoinRequest).status === "pending"
            ? "Process Join Request"
            : "Request Details"}
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Ministry:</strong>{" "}
                {(editingItem as MinistryJoinRequest).ministry_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Name:</strong>{" "}
                {(editingItem as MinistryJoinRequest).member_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Email:</strong>{" "}
                {(editingItem as MinistryJoinRequest).member_email || "-"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Phone:</strong>{" "}
                {(editingItem as MinistryJoinRequest).member_phone || "-"}
              </Typography>
              {(editingItem as MinistryJoinRequest).status === "pending" && (
                <TextField
                  fullWidth
                  label="Notes (optional)"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {editingItem &&
            (editingItem as MinistryJoinRequest).status === "pending" && (
              <>
                {requestAction === "reject" && (
                  <Button
                    onClick={() => handleRejectRequest(editingItem.id)}
                    color="error"
                    variant="contained"
                  >
                    Reject
                  </Button>
                )}
                {requestAction === "approve" && (
                  <Button
                    onClick={() => handleApproveRequest(editingItem.id)}
                    color="success"
                    variant="contained"
                  >
                    Approve
                  </Button>
                )}
              </>
            )}
        </DialogActions>
      </Dialog>

      {/* Outreach Events Tab */}
      <TabPanel value={tabValue} index={3}>
        {!isAdmin ? (
          <Typography color="text.secondary">
            Only admins can manage outreach events.
          </Typography>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth sx={{ maxWidth: 400 }}>
                <InputLabel>Select Ministry</InputLabel>
                <Select
                  value={selectedMinistryId}
                  onChange={(e) => {
                    setSelectedMinistryId(e.target.value);
                    setSelectedOutreachEventId("");
                  }}
                  label="Select Ministry"
                >
                  {filteredMinistries.map((ministry) => (
                    <MenuItem key={ministry.id} value={ministry.id}>
                      {ministry.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedMinistryId && (
              <>
                <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6">Outreach Events</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenOutreachEventDialog()}
                  >
                    Add Event
                  </Button>
                </Box>

                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {outreachEvents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No outreach events yet. Create your first event!
                          </TableCell>
                        </TableRow>
                      ) : (
                        outreachEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.title}</TableCell>
                            <TableCell>
                              {new Date(event.event_date).toLocaleDateString()}
                              {event.event_time && ` ${event.event_time}`}
                            </TableCell>
                            <TableCell>{event.location || "-"}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenOutreachEventDialog(event)}
                                title="Edit Event"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedOutreachEventId(event.id);
                                }}
                                title="View Gallery"
                              >
                                <PhotoLibraryIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteOutreachEvent(event.id)}
                                title="Delete Event"
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

                {selectedOutreachEventId && (
                  <>
                    <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6">
                        Gallery: {outreachEvents.find(e => e.id === selectedOutreachEventId)?.title}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenGalleryDialog()}
                      >
                        Add Photos
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          sm: "repeat(2, minmax(0, 1fr))",
                          md: "repeat(3, minmax(0, 1fr))",
                          lg: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      {outreachGalleryPhotos.map((photo) => (
                        <Paper
                          key={photo.id}
                          sx={{
                            p: 1,
                            position: "relative",
                            "&:hover .photo-actions": {
                              opacity: 1,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "75%",
                              bgcolor: "grey.100",
                              borderRadius: 1,
                              overflow: "hidden",
                              mb: 1,
                            }}
                          >
                            <img
                              src={photo.image_url}
                              alt={photo.caption || "Gallery photo"}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <Box
                              className="photo-actions"
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                opacity: 0,
                                transition: "opacity 0.2s",
                                display: "flex",
                                gap: 0.5,
                                bgcolor: "rgba(0,0,0,0.5)",
                                borderRadius: 1,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleOpenGalleryDialog(photo)}
                                sx={{ color: "white" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteGalleryPhoto(photo.id)}
                                sx={{ color: "white" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          {photo.caption && (
                            <Typography variant="caption" noWrap>
                              {photo.caption}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>

                    {outreachGalleryPhotos.length === 0 && (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography color="text.secondary">
                          No photos yet. Add your first photo!
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </TabPanel>

      {/* Outreach Event Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "outreach-event"}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Edit Outreach Event" : "Add Outreach Event"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={outreachEventForm.title}
            onChange={(e) =>
              setOutreachEventForm({ ...outreachEventForm, title: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={outreachEventForm.description}
            onChange={(e) =>
              setOutreachEventForm({ ...outreachEventForm, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Event Date"
            type="date"
            value={outreachEventForm.event_date}
            onChange={(e) =>
              setOutreachEventForm({ ...outreachEventForm, event_date: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Event Time"
            type="time"
            value={outreachEventForm.event_time}
            onChange={(e) =>
              setOutreachEventForm({ ...outreachEventForm, event_time: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Location"
            value={outreachEventForm.location}
            onChange={(e) =>
              setOutreachEventForm({ ...outreachEventForm, location: e.target.value })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveOutreachEvent} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Outreach Gallery Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "outreach-gallery"}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingGalleryPhoto ? "Edit Photo" : "Add Photo"}
        </DialogTitle>
        <DialogContent>
          <ImageUpload
            mode="single"
            bucket="ministry-images"
            value={typeof outreachGalleryForm.image_url === "string" ? outreachGalleryForm.image_url : ""}
            onChange={(url) =>
              setOutreachGalleryForm({ ...outreachGalleryForm, image_url: url as string })
            }
            label="Photo"
          />
          <TextField
            fullWidth
            label="Caption"
            value={outreachGalleryForm.caption}
            onChange={(e) =>
              setOutreachGalleryForm({ ...outreachGalleryForm, caption: e.target.value })
            }
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Date Taken"
            type="date"
            value={outreachGalleryForm.taken_at}
            onChange={(e) =>
              setOutreachGalleryForm({ ...outreachGalleryForm, taken_at: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          {!editingGalleryPhoto && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Or upload multiple photos at once:
              </Typography>
              <ImageUpload
                mode="multiple"
                bucket="ministry-images"
                value={[]}
                onChange={(urls) => {
                  if (Array.isArray(urls) && urls.length > 0) {
                    handleBulkUploadGallery(urls);
                  }
                }}
                label="Upload Multiple Photos"
                maxFiles={20}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveGalleryPhoto} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
