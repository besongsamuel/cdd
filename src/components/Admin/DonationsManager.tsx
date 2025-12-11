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
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
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
import { budgetService } from "../../services/budgetService";
import { donationCategoryService } from "../../services/donationCategoryService";
import { donationsService } from "../../services/donationsService";
import type {
  Donation,
  DonationCategory,
  DonationStatus,
  YearlyBudget,
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
      id={`donations-tabpanel-${index}`}
      aria-labelledby={`donations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const DonationsManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [budgets, setBudgets] = useState<YearlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "donation" | "category" | "budget"
  >("donation");
  const [editingItem, setEditingItem] = useState<
    Donation | DonationCategory | YearlyBudget | null
  >(null);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<DonationStatus | "all">(
    "all"
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  const [donationForm, setDonationForm] = useState({
    amount: "",
    donor_name: "",
    donor_email: "",
    category_id: "",
    status: "pending" as DonationStatus,
    notes: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    is_active: true,
    display_order: 0,
  });

  const [budgetForm, setBudgetForm] = useState({
    year: new Date().getFullYear(),
    category_id: "",
    target_amount: "",
    allocated_amount: "",
    notes: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      loadDonations();
    } else if (tabValue === 1) {
      loadCategories();
    } else if (tabValue === 2) {
      loadBudgets();
    }
  }, [tabValue, selectedYear]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadDonations(), loadCategories(), loadBudgets()]);
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async () => {
    try {
      const data = await donationsService.getAll();
      setDonations(data);
      const statsData = await donationsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading donations:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await donationCategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadBudgets = async () => {
    try {
      const data = await budgetService.getByYear(selectedYear);
      setBudgets(data);
    } catch (error) {
      console.error("Error loading budgets:", error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (
    type: "donation" | "category" | "budget",
    item?: Donation | DonationCategory | YearlyBudget
  ) => {
    setDialogType(type);
    setEditingItem(item || null);

    if (type === "donation" && item) {
      const donation = item as Donation;
      setDonationForm({
        amount: donation.amount.toString(),
        donor_name: donation.donor_name || "",
        donor_email: donation.donor_email || "",
        category_id: donation.category_id || "",
        status: donation.status,
        notes: donation.notes || "",
      });
    } else if (type === "category" && item) {
      const category = item as DonationCategory;
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active,
        display_order: category.display_order,
      });
    } else if (type === "budget" && item) {
      const budget = item as YearlyBudget;
      setBudgetForm({
        year: budget.year,
        category_id: budget.category_id,
        target_amount: budget.target_amount.toString(),
        allocated_amount: budget.allocated_amount.toString(),
        notes: budget.notes || "",
      });
    } else {
      // Reset forms for new items
      if (type === "donation") {
        setDonationForm({
          amount: "",
          donor_name: "",
          donor_email: "",
          category_id: "",
          status: "pending",
          notes: "",
        });
      } else if (type === "category") {
        setCategoryForm({
          name: "",
          description: "",
          is_active: true,
          display_order: categories.length,
        });
      } else if (type === "budget") {
        setBudgetForm({
          year: selectedYear,
          category_id: "",
          target_amount: "",
          allocated_amount: "",
          notes: "",
        });
      }
    }

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSaveDonation = async () => {
    try {
      const donationData = {
        amount: parseFloat(donationForm.amount),
        donor_name: donationForm.donor_name || undefined,
        donor_email: donationForm.donor_email || undefined,
        category_id: donationForm.category_id || undefined,
        status: donationForm.status,
        notes: donationForm.notes || undefined,
      };

      if (editingItem) {
        await donationsService.update(
          (editingItem as Donation).id,
          donationData
        );
      } else {
        await donationsService.create({
          ...donationData,
          etransfer_email: "info@eglisecitededavid.com",
        });
      }
      await loadDonations();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving donation:", error);
      alert("Failed to save donation");
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingItem) {
        await donationCategoryService.update(
          (editingItem as DonationCategory).id,
          categoryForm
        );
      } else {
        await donationCategoryService.create(categoryForm);
      }
      await loadCategories();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    }
  };

  const handleSaveBudget = async () => {
    try {
      const budgetData = {
        year: budgetForm.year,
        category_id: budgetForm.category_id,
        target_amount: parseFloat(budgetForm.target_amount),
        allocated_amount: parseFloat(budgetForm.allocated_amount) || 0,
        notes: budgetForm.notes || undefined,
      };

      if (editingItem) {
        await budgetService.update(
          (editingItem as YearlyBudget).id,
          budgetData
        );
      } else {
        await budgetService.create(budgetData);
      }
      await loadBudgets();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget");
    }
  };

  const handleDelete = async (
    type: "donation" | "category" | "budget",
    id: string
  ) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      if (type === "donation") {
        await donationsService.delete(id);
        await loadDonations();
      } else if (type === "category") {
        await donationCategoryService.delete(id);
        await loadCategories();
      } else if (type === "budget") {
        await budgetService.delete(id);
        await loadBudgets();
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete");
    }
  };

  const getStatusColor = (status: DonationStatus) => {
    switch (status) {
      case "pending":
        return "warning";
      case "received":
        return "info";
      case "verified":
        return "success";
      default:
        return "default";
    }
  };

  const filteredDonations = donations.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterCategory !== "all" && d.category_id !== filterCategory)
      return false;
    return true;
  });

  if (loading && tabValue === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Donations Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Donations" />
          <Tab label="Categories" />
          <Tab label="Budgets" />
        </Tabs>
      </Box>

      {/* Donations Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog("donation")}
          >
            Add Donation
          </Button>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as DonationStatus | "all")
              }
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {stats && (
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Paper sx={{ p: 2, minWidth: 150 }}>
              <Typography color="text.secondary">Total Donations</Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 150 }}>
              <Typography color="text.secondary">Total Amount</Typography>
              <Typography variant="h5">
                ${stats.totalAmount.toLocaleString()}
              </Typography>
            </Paper>
          </Box>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Donor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>${donation.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {donation.donor_name || "Anonymous"}
                    {donation.donor_email && (
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {donation.donor_email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {donation.category_name || "Unspecified"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={donation.status}
                      color={getStatusColor(donation.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(donation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog("donation", donation)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete("donation", donation.id)}
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

      {/* Categories Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog("category")}
          >
            Add Category
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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {category.description || (
                      <Typography variant="body2" color="text.secondary">
                        No description
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{category.display_order}</TableCell>
                  <TableCell>
                    <Chip
                      label={category.is_active ? "Active" : "Inactive"}
                      color={category.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog("category", category)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete("category", category.id)}
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

      {/* Budgets Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog("budget")}
          >
            Add Budget
          </Button>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as number)}
              label="Year"
            >
              {[2024, 2025, 2026, 2027, 2028].map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Allocated</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.map((budget) => {
                const progress =
                  (budget.allocated_amount / budget.target_amount) * 100;
                return (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.category_name}</TableCell>
                    <TableCell>
                      ${budget.target_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ${budget.allocated_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: "100%", maxWidth: 200 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {progress.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog("budget", budget)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete("budget", budget.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Dialogs */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Edit" : "Add"}{" "}
          {dialogType === "donation"
            ? "Donation"
            : dialogType === "category"
            ? "Category"
            : "Budget"}
        </DialogTitle>
        <DialogContent>
          {dialogType === "donation" && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={donationForm.amount}
                onChange={(e) =>
                  setDonationForm({ ...donationForm, amount: e.target.value })
                }
                margin="normal"
                required
                inputProps={{ step: "0.01", min: "0.01" }}
              />
              <TextField
                fullWidth
                label="Donor Name"
                value={donationForm.donor_name}
                onChange={(e) =>
                  setDonationForm({
                    ...donationForm,
                    donor_name: e.target.value,
                  })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Donor Email"
                type="email"
                value={donationForm.donor_email}
                onChange={(e) =>
                  setDonationForm({
                    ...donationForm,
                    donor_email: e.target.value,
                  })
                }
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={donationForm.category_id}
                  onChange={(e) =>
                    setDonationForm({
                      ...donationForm,
                      category_id: e.target.value,
                    })
                  }
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={donationForm.status}
                  onChange={(e) =>
                    setDonationForm({
                      ...donationForm,
                      status: e.target.value as DonationStatus,
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={donationForm.notes}
                onChange={(e) =>
                  setDonationForm({ ...donationForm, notes: e.target.value })
                }
                margin="normal"
              />
            </Box>
          )}

          {dialogType === "category" && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={categoryForm.display_order}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={categoryForm.is_active}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        is_active: e.target.checked,
                      })
                    }
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {dialogType === "budget" && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={budgetForm.year}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    year: parseInt(e.target.value) || new Date().getFullYear(),
                  })
                }
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={budgetForm.category_id}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      category_id: e.target.value,
                    })
                  }
                  label="Category"
                  disabled={!!editingItem}
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Target Amount"
                type="number"
                value={budgetForm.target_amount}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    target_amount: e.target.value,
                  })
                }
                margin="normal"
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
              <TextField
                fullWidth
                label="Allocated Amount"
                type="number"
                value={budgetForm.allocated_amount}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    allocated_amount: e.target.value,
                  })
                }
                margin="normal"
                inputProps={{ step: "0.01", min: "0" }}
              />
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={budgetForm.notes}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, notes: e.target.value })
                }
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={
              dialogType === "donation"
                ? handleSaveDonation
                : dialogType === "category"
                ? handleSaveCategory
                : handleSaveBudget
            }
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
