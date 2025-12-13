import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
import { departmentJoinRequestsService } from "../../services/departmentJoinRequestsService";
import { departmentMembersService } from "../../services/departmentMembersService";
import { departmentsService } from "../../services/departmentsService";
import { membersService } from "../../services/membersService";
import type {
  Department,
  DepartmentJoinRequest,
  DepartmentMember,
  DepartmentRequestStatus,
  Member,
} from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";

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
      id={`departments-tabpanel-${index}`}
      aria-labelledby={`departments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const DepartmentsManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [departmentMembers, setDepartmentMembers] = useState<
    DepartmentMember[]
  >([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<DepartmentJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "department" | "member" | "request"
  >("department");
  const [editingItem, setEditingItem] = useState<
    Department | DepartmentJoinRequest | null
  >(null);
  const [filterStatus, setFilterStatus] = useState<
    DepartmentRequestStatus | "all"
  >("all");

  const [departmentForm, setDepartmentForm] = useState({
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

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      loadMembers();
      loadAllMembers();
    } else if (tabValue === 2) {
      loadJoinRequests();
    }
  }, [tabValue, selectedDepartmentId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDepartments(),
        loadMembers(),
        loadAllMembers(),
        loadJoinRequests(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentsService.getAll();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadMembers = async () => {
    if (!selectedDepartmentId) {
      setDepartmentMembers([]);
      return;
    }
    try {
      const data = await departmentMembersService.getByDepartment(
        selectedDepartmentId
      );
      setDepartmentMembers(data);
    } catch (error) {
      console.error("Error loading department members:", error);
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
      const data = await departmentJoinRequestsService.getAll();
      setJoinRequests(data);
    } catch (error) {
      console.error("Error loading join requests:", error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDepartmentDialog = (department?: Department) => {
    setDialogType("department");
    setEditingItem(department || null);
    if (department) {
      setDepartmentForm({
        name: department.name,
        description: department.description || "",
        image_url: department.image_url || "",
        display_order: department.display_order,
        is_active: department.is_active,
      });
    } else {
      setDepartmentForm({
        name: "",
        description: "",
        image_url: "",
        display_order: departments.length,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setRequestNotes("");
  };

  const handleSaveDepartment = async () => {
    try {
      if (editingItem) {
        await departmentsService.update(editingItem.id, departmentForm);
      } else {
        await departmentsService.create(departmentForm);
      }
      handleCloseDialog();
      loadDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
      alert(error instanceof Error ? error.message : "Error saving department");
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await departmentsService.delete(id);
      loadDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert(
        error instanceof Error ? error.message : "Error deleting department"
      );
    }
  };

  const handleAddMember = async (memberId: string) => {
    if (!selectedDepartmentId) return;
    try {
      await departmentMembersService.addMember(
        selectedDepartmentId,
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
    if (!selectedDepartmentId) return;
    if (!confirm("Remove this member from the department?")) return;
    try {
      await departmentMembersService.removeMember(
        selectedDepartmentId,
        memberId
      );
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
    if (!selectedDepartmentId) return;
    try {
      await departmentMembersService.setLead(
        selectedDepartmentId,
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
      await departmentJoinRequestsService.updateStatus(
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
      await departmentJoinRequestsService.updateStatus(
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
      await departmentJoinRequestsService.delete(id);
      loadJoinRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error instanceof Error ? error.message : "Error deleting request");
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? joinRequests
      : joinRequests.filter((r) => r.status === filterStatus);

  const availableMembers = allMembers.filter(
    (m) => !departmentMembers.some((dm) => dm.member_id === m.id)
  );

  if (loading && departments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Departments Management
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Departments" />
        <Tab label="Members" />
        <Tab label="Join Requests" />
      </Tabs>

      {/* Departments Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDepartmentDialog()}
          >
            Add Department
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>
                    {department.description
                      ? department.description.substring(0, 50) + "..."
                      : "-"}
                  </TableCell>
                  <TableCell>{department.display_order}</TableCell>
                  <TableCell>
                    <Chip
                      label={department.is_active ? "Active" : "Inactive"}
                      color={department.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDepartmentDialog(department)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
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
            <InputLabel>Select Department</InputLabel>
            <Select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              label="Select Department"
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedDepartmentId && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Current Members
              </Typography>
              {availableMembers.length > 0 && (
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
                  {departmentMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No members in this department
                      </TableCell>
                    </TableRow>
                  ) : (
                    departmentMembers.map((dm) => (
                      <TableRow key={dm.id}>
                        <TableCell>{dm.member_name || "Unknown"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={dm.is_lead}
                            onChange={() =>
                              handleToggleLead(dm.member_id, dm.is_lead)
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMember(dm.member_id)}
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
                <TableCell>Department</TableCell>
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
                    <TableCell>{request.department_name || "-"}</TableCell>
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

      {/* Department Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "department"}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Edit Department" : "Add Department"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={departmentForm.name}
            onChange={(e) =>
              setDepartmentForm({ ...departmentForm, name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (Markdown)"
            value={departmentForm.description}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                description: e.target.value,
              })
            }
            margin="normal"
            multiline
            rows={6}
          />
          <TextField
            fullWidth
            label="Image URL"
            value={departmentForm.image_url}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                image_url: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Display Order"
            type="number"
            value={departmentForm.display_order}
            onChange={(e) =>
              setDepartmentForm({
                ...departmentForm,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={departmentForm.is_active}
                onChange={(e) =>
                  setDepartmentForm({
                    ...departmentForm,
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
          <Button onClick={handleSaveDepartment} variant="contained">
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
          (editingItem as DepartmentJoinRequest).status === "pending"
            ? "Process Join Request"
            : "Request Details"}
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Department:</strong>{" "}
                {(editingItem as DepartmentJoinRequest).department_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Name:</strong>{" "}
                {(editingItem as DepartmentJoinRequest).member_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Email:</strong>{" "}
                {(editingItem as DepartmentJoinRequest).member_email || "-"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Phone:</strong>{" "}
                {(editingItem as DepartmentJoinRequest).member_phone || "-"}
              </Typography>
              {(editingItem as DepartmentJoinRequest).status === "pending" && (
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
            (editingItem as DepartmentJoinRequest).status === "pending" && (
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
    </Box>
  );
};
