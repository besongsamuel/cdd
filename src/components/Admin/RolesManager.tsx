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
  Alert,
  Chip,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import { roleService } from '../../services/roleService';
import { permissionsService } from '../../services/permissionsService';
import { membersService } from '../../services/membersService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Role, Permission, Member } from '../../types';

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
      id={`roles-tabpanel-${index}`}
      aria-labelledby={`roles-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const RolesManager = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
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

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRoles(), loadPermissions(), loadMembers()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await roleService.getAllRoles();
      setRoles(data);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await permissionsService.getAll();
      setPermissions(data);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      await loadRoles();
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
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleOpenPermissionsDialog = async (role: Role) => {
    setSelectedRole(role);
    // Load current permissions for this role
    const rolePermissions = role.permissions || [];
    setSelectedPermissions(rolePermissions.map(p => p.id));
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      // Get current permissions
      const currentRole = roles.find(r => r.id === selectedRole.id);
      const currentPermissionIds = (currentRole?.permissions || []).map(p => p.id);

      // Find permissions to add and remove
      const toAdd = selectedPermissions.filter(id => !currentPermissionIds.includes(id));
      const toRemove = currentPermissionIds.filter(id => !selectedPermissions.includes(id));

      // Apply changes
      for (const permId of toAdd) {
        await roleService.assignPermissionToRole(selectedRole.id, permId);
      }
      for (const permId of toRemove) {
        await roleService.removePermissionFromRole(selectedRole.id, permId);
      }

      await loadRoles();
      setPermissionsDialogOpen(false);
      setSelectedRole(null);
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
      // Check if member already has this role
      const memberRoles = await roleService.getMemberRoles(selectedMember.id);
      const hasRole = memberRoles.some(r => r.id === selectedRoleForAssignment.id);

      if (hasRole) {
        setError('Member already has this role');
        return;
      }

      await roleService.assignRole(selectedMember.id, selectedRoleForAssignment.id);
      handleCloseAssignRoleDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roles</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="All Roles" />
        <Tab label="Role Details" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Superuser</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No roles found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {role.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      {role.is_superuser ? (
                        <Chip label="Yes" color="primary" size="small" />
                      ) : (
                        <Chip label="No" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {(role.permissions || []).length} permission(s)
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Assign Role to Member">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAssignRoleDialog(role)}
                          color="primary"
                        >
                          <PersonAddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Permissions">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenPermissionsDialog(role)}
                          color="primary"
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Role">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(role)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Role">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(role.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="body1" color="text.secondary">
          Select a role from the table above and click "Manage Permissions" to view details.
        </Typography>
      </TabPanel>

      {/* Role Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Add Role'}
        </DialogTitle>
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

      {/* Permissions Management Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Permissions: {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select permissions to assign to this role:
            </Typography>
            <List>
              {permissions.map((permission) => (
                <ListItem key={permission.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
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

      {/* Assign Role to Member Dialog */}
      <Dialog open={assignRoleDialogOpen} onClose={handleCloseAssignRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Role: {selectedRoleForAssignment?.name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={members}
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
              filterOptions={(options, { inputValue }) => {
                return options.filter((option) =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
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
          <Button
            onClick={handleAssignRoleToMember}
            variant="contained"
            disabled={!selectedMember}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

