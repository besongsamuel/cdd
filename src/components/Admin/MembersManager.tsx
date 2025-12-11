import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { membersService } from '../../services/membersService';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Member, MemberType } from '../../types';

export const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'regular' as MemberType,
    bio: '',
    passions: [] as string[],
  });
  const [passionInput, setPassionInput] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
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
        bio: member.bio || '',
        passions: member.passions || [],
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        type: 'regular',
        bio: '',
        passions: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setPassionInput('');
  };

  const handleSubmit = async () => {
    try {
      if (editingMember) {
        await membersService.update(editingMember.id, formData);
      } else {
        await membersService.create(formData);
      }
      handleCloseDialog();
      loadMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      await membersService.delete(id);
      loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('member-photos').getPublicUrl(fileName);
      await membersService.update(memberId, { picture_url: data.publicUrl });
      loadMembers();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const addPassion = () => {
    if (passionInput.trim()) {
      setFormData({
        ...formData,
        passions: [...formData.passions, passionInput.trim()],
      });
      setPassionInput('');
    }
  };

  const removePassion = (index: number) => {
    setFormData({
      ...formData,
      passions: formData.passions.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Members Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Member
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Bio</TableCell>
              <TableCell>Passions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>
                  <Chip label={member.type} size="small" />
                </TableCell>
                <TableCell>{member.bio || '-'}</TableCell>
                <TableCell>
                  {member.passions && member.passions.length > 0
                    ? member.passions.join(', ')
                    : '-'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(member)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(member.id)}>
                    <DeleteIcon />
                  </IconButton>
                  {member.type === 'leader' && (
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, member.id)}
                      />
                      <IconButton size="small" component="span">
                        📷
                      </IconButton>
                    </label>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MemberType })}
              label="Type"
            >
              <MenuItem value="leader">Leader</MenuItem>
              <MenuItem value="regular">Regular</MenuItem>
            </Select>
          </FormControl>
          {formData.type === 'leader' && (
            <TextField
              fullWidth
              label="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          )}
          {formData.type === 'regular' && (
            <Box margin="normal">
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small"
                  label="Add Passion"
                  value={passionInput}
                  onChange={(e) => setPassionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPassion()}
                />
                <Button onClick={addPassion}>Add</Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.passions.map((passion, index) => (
                  <Chip
                    key={index}
                    label={passion}
                    onDelete={() => removePassion(index)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
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


