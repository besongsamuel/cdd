import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
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
  IconButton,
  InputAdornment,
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
import { membersService } from "../../services/membersService";
import { profileService } from "../../services/profileService";
import type { Member, MemberType } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { PassionsAutocomplete } from "../common/PassionsAutocomplete";
import { ProfilePictureUpload } from "../common/ProfilePictureUpload";

export const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "regular" as MemberType,
    bio: "",
    passions: [] as string[],
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

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
        passions: member.passions || [],
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: "",
        type: "regular",
        bio: "",
        passions: [],
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

  const handleProfilePictureSelected = (file: File) => {
    setProfilePicture(file);
  };

  const handleProfilePictureRemove = () => {
    setProfilePicture(null);
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
              <TableCell>Type</TableCell>
              <TableCell>Bio</TableCell>
              <TableCell>Passions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
                  <TableCell>
                    <Chip label={member.type} size="small" />
                  </TableCell>
                  <TableCell>{member.bio || "-"}</TableCell>
                  <TableCell>
                    {member.passions && member.passions.length > 0
                      ? member.passions.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(member)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(member.id)}
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
    </Box>
  );
};
