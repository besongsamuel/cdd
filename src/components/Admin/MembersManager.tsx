import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import {
    Avatar,
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
    InputAdornment,
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
import { membersService } from "../../services/membersService";
import { permissionsService } from "../../services/permissionsService";
import { profileService } from "../../services/profileService";
import { roleService } from "../../services/roleService";
import { titlesService } from "../../services/titlesService";
import type { Member, MemberType, Permission, Role, Title } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { PassionsAutocomplete } from "../common/PassionsAutocomplete";
import { ProfilePictureUpload } from "../common/ProfilePictureUpload";

export const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [titles, setTitles] = useState<Title[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "regular" as MemberType,
    bio: "",
    email: "",
    phone: "",
    passions: [] as string[],
    title_id: "" as string | undefined,
    is_verified: false,
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [rolesPermissionsDialogOpen, setRolesPermissionsDialogOpen] = useState(false);
  const [selectedMemberForRoles, setSelectedMemberForRoles] = useState<Member | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [memberRoles, setMemberRoles] = useState<Role[]>([]);
  const [memberDirectPermissions, setMemberDirectPermissions] = useState<Permission[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    loadMembers();
    loadTitles();
    loadRolesAndPermissions();
  }, []);

  const loadRolesAndPermissions = async () => {
    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getAllRoles(),
        permissionsService.getAll(),
      ]);
      setAllRoles(rolesData);
      setAllPermissions(permissionsData);
    } catch (error) {
      console.error("Error loading roles and permissions:", error);
    }
  };

  const loadTitles = async () => {
    try {
      const titlesData = await titlesService.getAll();
      setTitles(titlesData);
    } catch (error) {
      console.error("Error loading titles:", error);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        type: member.type,
        bio: member.bio || "",
        email: member.email || "",
        phone: member.phone || "",
        passions: member.passions || [],
        title_id: member.title_id || undefined,
        is_verified: member.is_verified ?? false,
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: "",
        type: "regular",
        bio: "",
        email: "",
        phone: "",
        passions: [],
        title_id: undefined,
        is_verified: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setProfilePicture(null);
  };

  const handleSubmit = async () => {
    try {
      let profilePictureUrl: string | undefined;

      if (editingMember) {
        // Update existing member
        const memberId = editingMember.id;

        // Upload profile picture if provided
        if (profilePicture) {
          setUploadingProfile(true);
          try {
            profilePictureUrl = await profileService.uploadProfilePicture(
              profilePicture,
              memberId
            );
          } finally {
            setUploadingProfile(false);
          }
        } else {
          profilePictureUrl = editingMember.picture_url;
        }

        await membersService.update(memberId, {
          ...formData,
          picture_url: profilePictureUrl,
        });
      } else {
        // Create new member
        const newMember = await membersService.create(formData);
        const memberId = newMember.id;

        // Upload profile picture if provided
        if (profilePicture) {
          setUploadingProfile(true);
          try {
            profilePictureUrl = await profileService.uploadProfilePicture(
              profilePicture,
              memberId
            );
            // Update member with picture URL
            await membersService.update(memberId, {
              picture_url: profilePictureUrl,
            });
          } finally {
            setUploadingProfile(false);
          }
        }
      }

      handleCloseDialog();
      loadMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to save member");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await membersService.delete(id);
      loadMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Failed to delete member");
    }
  };

  const handleToggleVerified = async (
    memberId: string,
    newVerifiedStatus: boolean
  ) => {
    try {
      await membersService.update(memberId, { is_verified: newVerifiedStatus });
      // Reload members to get updated data
      loadMembers();
    } catch (error) {
      console.error("Error toggling verification status:", error);
      alert("Failed to update verification status");
    }
  };

  const handleProfilePictureSelected = (file: File) => {
    setProfilePicture(file);
  };

  const handleProfilePictureRemove = () => {
    setProfilePicture(null);
  };

  const handleOpenRolesPermissionsDialog = async (member: Member) => {
    setSelectedMemberForRoles(member);
    try {
      const [roles, directPermissions] = await Promise.all([
        roleService.getMemberRoles(member.id),
        roleService.getMemberDirectPermissions(member.id),
      ]);
      setMemberRoles(roles);
      setMemberDirectPermissions(directPermissions);
      setSelectedRoleIds(roles.map((r) => r.id));
      setSelectedPermissionIds(directPermissions.map((p) => p.id));
      setRolesPermissionsDialogOpen(true);
    } catch (error) {
      console.error("Error loading member roles and permissions:", error);
      alert("Failed to load roles and permissions");
    }
  };

  const handleCloseRolesPermissionsDialog = () => {
    setRolesPermissionsDialogOpen(false);
    setSelectedMemberForRoles(null);
    setMemberRoles([]);
    setMemberDirectPermissions([]);
    setSelectedRoleIds([]);
    setSelectedPermissionIds([]);
  };

  const handleSaveRolesPermissions = async () => {
    if (!selectedMemberForRoles) return;

    try {
      // Get current roles and permissions
      const currentRoleIds = memberRoles.map((r) => r.id);
      const currentPermissionIds = memberDirectPermissions.map((p) => p.id);

      // Find roles to add and remove
      const rolesToAdd = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
      const rolesToRemove = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

      // Find permissions to add and remove
      const permissionsToAdd = selectedPermissionIds.filter(
        (id) => !currentPermissionIds.includes(id)
      );
      const permissionsToRemove = currentPermissionIds.filter(
        (id) => !selectedPermissionIds.includes(id)
      );

      // Apply changes
      for (const roleId of rolesToAdd) {
        await roleService.assignRole(selectedMemberForRoles.id, roleId);
      }
      for (const roleId of rolesToRemove) {
        await roleService.removeRole(selectedMemberForRoles.id, roleId);
      }

      for (const permissionId of permissionsToAdd) {
        await roleService.assignPermission(selectedMemberForRoles.id, permissionId);
      }
      for (const permissionId of permissionsToRemove) {
        await roleService.removePermission(selectedMemberForRoles.id, permissionId);
      }

      await loadMembers();
      handleCloseRolesPermissionsDialog();
    } catch (error) {
      console.error("Error saving roles and permissions:", error);
      alert("Failed to save roles and permissions");
    }
  };

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = member.name?.toLowerCase().includes(query);
    const emailMatch = member.email?.toLowerCase().includes(query);
    return nameMatch || emailMatch;
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
        <Typography variant="h5">Members Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Member
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Bio</TableCell>
              <TableCell>Passions</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {searchQuery
                    ? "No members found matching your search"
                    : "No members found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Avatar
                      src={member.picture_url}
                      alt={member.name}
                      sx={{ width: 40, height: 40 }}
                    >
                      {member.name[0].toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email || "-"}</TableCell>
                  <TableCell>{member.phone || "-"}</TableCell>
                  <TableCell>
                    <Chip label={member.type} size="small" />
                  </TableCell>
                  <TableCell>{member.title_name || "-"}</TableCell>
                  <TableCell>{member.bio || "-"}</TableCell>
                  <TableCell>
                    {member.passions && member.passions.length > 0
                      ? member.passions.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={member.is_verified ?? false}
                      onChange={(e) =>
                        handleToggleVerified(member.id, e.target.checked)
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(member)}
                      title="Edit Member"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenRolesPermissionsDialog(member)}
                      title="Manage Roles & Permissions"
                      color="primary"
                    >
                      <SecurityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(member.id)}
                      title="Delete Member"
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
          {editingMember ? "Edit Member" : "Add Member"}
        </DialogTitle>
        <DialogContent>
          {/* Profile Picture */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <ProfilePictureUpload
              currentImageUrl={editingMember?.picture_url}
              onImageSelected={handleProfilePictureSelected}
              onImageRemove={handleProfilePictureRemove}
              uploading={uploadingProfile}
              label="Profile Picture"
              size="medium"
              aspectRatio="square"
            />
          </Box>

          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            margin="normal"
            helperText="Member's email address"
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            margin="normal"
            helperText="Member's phone number"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as MemberType })
              }
              label="Type"
            >
              <MenuItem value="leader">Leader</MenuItem>
              <MenuItem value="regular">Regular</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Title</InputLabel>
            <Select
              value={formData.title_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title_id: e.target.value || undefined,
                })
              }
              label="Title"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {titles.map((title) => (
                <MenuItem key={title.id} value={title.id}>
                  {title.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {formData.type === "leader" && (
            <TextField
              fullWidth
              label="Bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_verified}
                onChange={(e) =>
                  setFormData({ ...formData, is_verified: e.target.checked })
                }
              />
            }
            label="Verified"
            sx={{ mt: 2 }}
          />
          <Box margin="normal">
            <PassionsAutocomplete
              value={formData.passions}
              onChange={(passions) => setFormData({ ...formData, passions })}
              label="Passions"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={uploadingProfile}
          >
            {uploadingProfile ? "Uploading..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Roles & Permissions Dialog */}
      <Dialog
        open={rolesPermissionsDialogOpen}
        onClose={handleCloseRolesPermissionsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Roles & Permissions: {selectedMemberForRoles?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Roles
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: "auto", mb: 3 }}>
              {allRoles.map((role) => (
                <FormControlLabel
                  key={role.id}
                  control={
                    <Switch
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoleIds([...selectedRoleIds, role.id]);
                        } else {
                          setSelectedRoleIds(
                            selectedRoleIds.filter((id) => id !== role.id)
                          );
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {role.name}
                        {role.is_superuser && (
                          <Chip
                            label="Superuser"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      {role.description && (
                        <Typography variant="caption" color="text.secondary">
                          {role.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Direct Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permissions assigned directly to this member (in addition to permissions from roles)
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: "auto" }}>
              {allPermissions.map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Switch
                      checked={selectedPermissionIds.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissionIds([
                            ...selectedPermissionIds,
                            permission.id,
                          ]);
                        } else {
                          setSelectedPermissionIds(
                            selectedPermissionIds.filter((id) => id !== permission.id)
                          );
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontWeight: "bold" }}
                      >
                        {permission.name}
                      </Typography>
                      {permission.description && (
                        <Typography variant="caption" color="text.secondary">
                          {permission.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRolesPermissionsDialog}>Cancel</Button>
          <Button onClick={handleSaveRolesPermissions} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
