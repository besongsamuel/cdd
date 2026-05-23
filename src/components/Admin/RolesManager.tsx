import { useCallback, useEffect, useState } from 'react';
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
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Autocomplete,
  Grid,
  Divider,
  Stack,
  Avatar,
  alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupIcon from '@mui/icons-material/Group';
import ShieldIcon from '@mui/icons-material/Shield';
import { roleService } from '../../services/roleService';
import { permissionsService } from '../../services/permissionsService';
import { membersService } from '../../services/membersService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Role, Permission, Member } from '../../types';

export const RolesManager = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_superuser: false,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [roleMemberCounts, setRoleMemberCounts] = useState<Record<string, number>>({});
  const [roleMembers, setRoleMembers] = useState<Member[]>([]);
  const [loadingRoleMembers, setLoadingRoleMembers] = useState(false);

  const loadRoleMembers = useCallback(async (roleId: string) => {
    setLoadingRoleMembers(true);
    try {
      const data = await roleService.getMembersByRole(roleId);
      setRoleMembers(data);
    } catch (err) {
      console.error('Error loading role members:', err);
      setRoleMembers([]);
    } finally {
      setLoadingRoleMembers(false);
    }
  }, []);

  const loadRoleMemberCounts = useCallback(async () => {
    const counts = await roleService.getRoleMemberCounts();
    setRoleMemberCounts(counts);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData, membersData, counts] = await Promise.all([
        roleService.getAllRoles(),
        permissionsService.getAll(),
        membersService.getAll(),
        roleService.getRoleMemberCounts(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setMembers(membersData);
      setRoleMemberCounts(counts);

      setSelectedRole((prev) => {
        if (prev && rolesData.some((r) => r.id === prev.id)) {
          return rolesData.find((r) => r.id === prev.id) ?? prev;
        }
        return rolesData[0] ?? null;
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (selectedRole) {
      loadRoleMembers(selectedRole.id);
    } else {
      setRoleMembers([]);
    }
  }, [selectedRole, loadRoleMembers]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        is_superuser: role.is_superuser,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        is_superuser: false,
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      is_superuser: false,
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description || undefined,
          is_superuser: formData.is_superuser,
        });
      } else {
        await roleService.createRole({
          name: formData.name,
          description: formData.description || undefined,
          is_superuser: formData.is_superuser,
        });
      }
      await loadAllData();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this role? This will remove it from all members.')) {
      return;
    }

    try {
      await roleService.deleteRole(id);
      if (selectedRole?.id === id) {
        setSelectedRole(null);
      }
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleOpenPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    const rolePermissions = role.permissions || [];
    setSelectedPermissions(rolePermissions.map((p) => p.id));
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      const currentRole = roles.find((r) => r.id === selectedRole.id);
      const currentPermissionIds = (currentRole?.permissions || []).map((p) => p.id);

      const toAdd = selectedPermissions.filter((id) => !currentPermissionIds.includes(id));
      const toRemove = currentPermissionIds.filter((id) => !selectedPermissions.includes(id));

      for (const permId of toAdd) {
        await roleService.assignPermissionToRole(selectedRole.id, permId);
      }
      for (const permId of toRemove) {
        await roleService.removePermissionFromRole(selectedRole.id, permId);
      }

      await loadAllData();
      setPermissionsDialogOpen(false);
      setSelectedPermissions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  };

  const handleOpenAssignRoleDialog = (role: Role) => {
    setSelectedRoleForAssignment(role);
    setSelectedMember(null);
    setMemberSearchQuery('');
    setAssignRoleDialogOpen(true);
  };

  const handleCloseAssignRoleDialog = () => {
    setAssignRoleDialogOpen(false);
    setSelectedRoleForAssignment(null);
    setSelectedMember(null);
    setMemberSearchQuery('');
  };

  const handleAssignRoleToMember = async () => {
    if (!selectedRoleForAssignment || !selectedMember) {
      setError('Please select a member');
      return;
    }

    try {
      const memberRoles = await roleService.getMemberRoles(selectedMember.id);
      const hasRole = memberRoles.some((r) => r.id === selectedRoleForAssignment.id);

      if (hasRole) {
        setError('Member already has this role');
        return;
      }

      await roleService.assignRole(selectedMember.id, selectedRoleForAssignment.id);
      handleCloseAssignRoleDialog();
      setError(null);
      await loadRoleMemberCounts();
      if (selectedRole?.id === selectedRoleForAssignment.id) {
        await loadRoleMembers(selectedRole.id);
      }
      setRoleMemberCounts((prev) => ({
        ...prev,
        [selectedRoleForAssignment.id]: (prev[selectedRoleForAssignment.id] || 0) + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const handleRemoveMemberFromRole = async (member: Member) => {
    if (!selectedRole) return;

    if (!window.confirm(`Remove "${member.name}" from the ${selectedRole.name} role?`)) {
      return;
    }

    try {
      await roleService.removeRole(member.id, selectedRole.id);
      await loadRoleMembers(selectedRole.id);
      await loadRoleMemberCounts();
      setRoleMemberCounts((prev) => ({
        ...prev,
        [selectedRole.id]: Math.max(0, (prev[selectedRole.id] || 1) - 1),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member from role');
    }
  };

  const getMemberInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return <LoadingSpinner />;
  }

  const detailRole = selectedRole
    ? roles.find((r) => r.id === selectedRole.id) ?? selectedRole
    : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Select a role to view details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No roles found. Create one to get started.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => {
                    const isSelected = selectedRole?.id === role.id;
                    return (
                      <TableRow
                        key={role.id}
                        hover
                        selected={isSelected}
                        onClick={() => handleSelectRole(role)}
                        sx={{
                          cursor: 'pointer',
                          ...(isSelected && {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          }),
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={600}>
                              {role.name}
                            </Typography>
                            {role.is_superuser && (
                              <Chip label="Superuser" color="primary" size="small" variant="outlined" />
                            )}
                          </Stack>
                          {role.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {role.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<GroupIcon />}
                            label={roleMemberCounts[role.id] ?? 0}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {role.is_superuser ? 'All' : `${(role.permissions || []).length}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Assign to member">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenAssignRoleDialog(role)}
                              color="primary"
                            >
                              <PersonAddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage permissions">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPermissionsDialog(role)}
                              color="primary"
                            >
                              <SettingsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit role">
                            <IconButton size="small" onClick={() => handleOpenDialog(role)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete role">
                            <IconButton size="small" onClick={() => handleDelete(role.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: 3, minHeight: 400 }}>
            {!detailRole ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 320,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <ShieldIcon sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />
                <Typography variant="h6" gutterBottom>
                  No role selected
                </Typography>
                <Typography variant="body2">
                  Click a role in the table to view its permissions and assigned members.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Role details
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    {detailRole.name}
                  </Typography>
                  {detailRole.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {detailRole.description}
                    </Typography>
                  )}
                  {detailRole.is_superuser && (
                    <Chip label="Superuser — all permissions" color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => handleOpenAssignRoleDialog(detailRole)}
                  >
                    Assign member
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => handleOpenPermissionsDialog(detailRole)}
                  >
                    Permissions
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(detailRole)}
                  >
                    Edit
                  </Button>
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Permissions
                  </Typography>
                  {detailRole.is_superuser ? (
                    <Typography variant="body2" color="text.secondary">
                      Superuser roles automatically grant every permission.
                    </Typography>
                  ) : (detailRole.permissions || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No permissions assigned. Use &quot;Permissions&quot; to add some.
                    </Typography>
                  ) : (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
                      {(detailRole.permissions || []).map((perm) => (
                        <Chip
                          key={perm.id}
                          label={perm.name}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">
                      Assigned members ({roleMembers.length})
                    </Typography>
                  </Stack>

                  {loadingRoleMembers ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading members…
                    </Typography>
                  ) : roleMembers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No members have this role yet. Use &quot;Assign member&quot; to add someone.
                    </Typography>
                  ) : (
                    <List dense disablePadding>
                      {roleMembers.map((member) => (
                        <ListItem
                          key={member.id}
                          sx={{
                            px: 0,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar src={member.picture_url} sx={{ width: 36, height: 36 }}>
                              {getMemberInitials(member.name)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name}
                            secondary={member.email || 'No email'}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Remove from role">
                              <IconButton
                                edge="end"
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMemberFromRole(member)}
                                aria-label={`Remove ${member.name} from role`}
                              >
                                <PersonRemoveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            disabled={!!editingRole}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_superuser}
                onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
              />
            }
            label="Superuser Role (grants all permissions automatically)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Permissions: {selectedRole?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select permissions to assign to this role:
            </Typography>
            <List>
              {permissions.map((permission) => (
                <ListItem key={permission.id} disablePadding>
                  <FormControlLabel
                    sx={{ width: '100%', mx: 0 }}
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((id) => id !== permission.id)
                            );
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
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
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained">
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignRoleDialogOpen} onClose={handleCloseAssignRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role: {selectedRoleForAssignment?.name}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={
                selectedRoleForAssignment?.id === selectedRole?.id
                  ? members.filter((m) => !roleMembers.some((rm) => rm.id === m.id))
                  : members
              }
              getOptionLabel={(option) => option.name}
              value={selectedMember}
              onChange={(_, newValue) => {
                setSelectedMember(newValue);
                setError(null);
              }}
              inputValue={memberSearchQuery}
              onInputChange={(_, newInputValue) => {
                setMemberSearchQuery(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Member"
                  placeholder="Search for a member..."
                  margin="normal"
                  fullWidth
                />
              )}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
            />
            {selectedMember && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Member:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedMember.name}
                </Typography>
                {selectedMember.email && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.email}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignRoleDialog}>Cancel</Button>
          <Button onClick={handleAssignRoleToMember} variant="contained" disabled={!selectedMember}>
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
