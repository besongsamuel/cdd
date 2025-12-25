import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useHasPermission } from "../hooks/usePermissions";
import { departmentMembersService } from "../services/departmentMembersService";
import { departmentsService } from "../services/departmentsService";
import type { Department } from "../types";

export const DepartmentsPage = () => {
  const { t } = useTranslation("departments");
  const navigate = useNavigate();
  const canManageDepartments = useHasPermission("manage:departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const activeDepartments = await departmentsService.getActive();
        setDepartments(activeDepartments);

        // Load member counts for each department
        const counts: Record<string, number> = {};
        for (const dept of activeDepartments) {
          const members = await departmentMembersService.getByDepartment(
            dept.id
          );
          counts[dept.id] = members.length;
        }
        setMemberCounts(counts);
      } catch (error) {
        console.error("Error loading departments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  const handleOpenDepartmentDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setDepartmentFormData({
        name: department.name,
        description: department.description || "",
        image_url: department.image_url || "",
        display_order: department.display_order,
        is_active: department.is_active,
      });
    } else {
      setEditingDepartment(null);
      setDepartmentFormData({
        name: "",
        description: "",
        image_url: "",
        display_order: departments.length,
        is_active: true,
      });
    }
    setDepartmentDialogOpen(true);
  };

  const handleCloseDepartmentDialog = () => {
    setDepartmentDialogOpen(false);
    setEditingDepartment(null);
  };

  const handleSaveDepartment = async () => {
    try {
      if (editingDepartment) {
        await departmentsService.update(editingDepartment.id, departmentFormData);
      } else {
        await departmentsService.create(departmentFormData);
      }
      handleCloseDepartmentDialog();
      // Reload departments
      const activeDepartments = await departmentsService.getActive();
      setDepartments(activeDepartments);
      // Reload member counts
      const counts: Record<string, number> = {};
      for (const dept of activeDepartments) {
        const members = await departmentMembersService.getByDepartment(dept.id);
        counts[dept.id] = members.length;
      }
      setMemberCounts(counts);
    } catch (error) {
      console.error("Error saving department:", error);
      alert("Failed to save department");
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }
    try {
      await departmentsService.delete(departmentId);
      // Reload departments
      const activeDepartments = await departmentsService.getActive();
      setDepartments(activeDepartments);
      // Reload member counts
      const counts: Record<string, number> = {};
      for (const dept of activeDepartments) {
        const members = await departmentMembersService.getByDepartment(dept.id);
        counts[dept.id] = members.length;
      }
      setMemberCounts(counts);
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department");
    }
  };

  if (loading) {
    return (
      <>
        <SEO
          title={t("title")}
          description={t("subtitle")}
          url="/departments"
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/departments" />
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        {/* Decorative Background Illustration */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.06,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 1000"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Connected circles representing teams */}
            <g transform="translate(200, 200)">
              <circle cx="0" cy="0" r="60" fill="#3b82f6" opacity="0.3" />
              <circle cx="150" cy="50" r="50" fill="#2563eb" opacity="0.3" />
              <circle cx="300" cy="0" r="55" fill="#60a5fa" opacity="0.3" />
              <line
                x1="60"
                y1="0"
                x2="100"
                y2="35"
                stroke="#2563eb"
                strokeWidth="3"
                opacity="0.4"
              />
              <line
                x1="210"
                y1="50"
                x2="245"
                y2="15"
                stroke="#2563eb"
                strokeWidth="3"
                opacity="0.4"
              />
            </g>

            {/* People silhouettes */}
            <g transform="translate(800, 300)">
              <circle cx="0" cy="0" r="25" fill="#3b82f6" opacity="0.4" />
              <path
                d="M -15 30 Q -15 45 0 50 Q 15 45 15 30 L 15 60 Q 15 75 0 80 Q -15 75 -15 60 Z"
                fill="#2563eb"
                opacity="0.4"
              />
            </g>
            <g transform="translate(900, 280)">
              <circle cx="0" cy="0" r="25" fill="#60a5fa" opacity="0.4" />
              <path
                d="M -15 30 Q -15 45 0 50 Q 15 45 15 30 L 15 60 Q 15 75 0 80 Q -15 75 -15 60 Z"
                fill="#3b82f6"
                opacity="0.4"
              />
            </g>
            <g transform="translate(1000, 300)">
              <circle cx="0" cy="0" r="25" fill="#2563eb" opacity="0.4" />
              <path
                d="M -15 30 Q -15 45 0 50 Q 15 45 15 30 L 15 60 Q 15 75 0 80 Q -15 75 -15 60 Z"
                fill="#3b82f6"
                opacity="0.4"
              />
            </g>

            {/* Gear/team icons */}
            <g transform="translate(150, 600)">
              <circle
                cx="0"
                cy="0"
                r="40"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                opacity="0.4"
              />
              <circle
                cx="0"
                cy="0"
                r="25"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                opacity="0.4"
              />
              <circle cx="0" cy="0" r="5" fill="#2563eb" opacity="0.5" />
              <rect
                x="-4"
                y="-25"
                width="8"
                height="10"
                fill="#3b82f6"
                opacity="0.5"
              />
              <rect
                x="-4"
                y="15"
                width="8"
                height="10"
                fill="#3b82f6"
                opacity="0.5"
              />
              <rect
                x="-25"
                y="-4"
                width="10"
                height="8"
                fill="#3b82f6"
                opacity="0.5"
              />
              <rect
                x="15"
                y="-4"
                width="10"
                height="8"
                fill="#3b82f6"
                opacity="0.5"
              />
            </g>

            {/* Abstract shapes */}
            <g transform="translate(950, 650)">
              <rect
                x="-30"
                y="-30"
                width="60"
                height="60"
                rx="15"
                fill="#60a5fa"
                opacity="0.2"
                transform="rotate(45)"
              />
              <rect
                x="-20"
                y="-20"
                width="40"
                height="40"
                rx="10"
                fill="#3b82f6"
                opacity="0.3"
                transform="rotate(45)"
              />
            </g>

            {/* Connecting lines */}
            <path
              d="M 400 150 Q 600 200 800 150"
              stroke="#2563eb"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M 200 450 Q 600 500 1000 450"
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </Box>

        <Container
          sx={{
            py: { xs: 4, md: 6 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            textAlign="center"
            sx={{ fontSize: { xs: "32px", md: "40px" }, mb: 2 }}
          >
            {t("title")}
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 4, fontSize: { xs: "16px", md: "17px" } }}
          >
            {t("subtitle")}
          </Typography>

          {departments.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              {t("noDepartments")}
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {departments.map((department) => (
                <Box key={department.id} sx={{ position: "relative" }}>
                  {canManageDepartments && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        display: "flex",
                        gap: 0.5,
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: 1,
                        p: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDepartmentDialog(department);
                        }}
                        sx={{ color: "primary.main" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDepartment(department.id);
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/departments/${department.id}`)}
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                      }}
                    >
                      {department.image_url ? (
                        <CardMedia
                          component="img"
                          image={department.image_url}
                          alt={department.name}
                          sx={{
                            height: { xs: 200, sm: 220 },
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: { xs: 200, sm: 220 },
                            backgroundColor: "primary.main",
                            opacity: 0.1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              color: "primary.main",
                              fontWeight: 600,
                              opacity: 0.5,
                            }}
                          >
                            {department.name.charAt(0)}
                          </Typography>
                        </Box>
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="h5"
                          component="h2"
                          gutterBottom
                          sx={{
                            fontSize: { xs: "20px", md: "22px" },
                            fontWeight: 600,
                          }}
                        >
                          {department.name}
                        </Typography>
                        {department.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              fontSize: { xs: "14px", md: "15px" },
                            }}
                          >
                            {department.description
                              .replace(/#{1,6}\s+/g, "")
                              .replace(/\*\*/g, "")
                              .substring(0, 150)}
                            {department.description.length > 150 ? "..." : ""}
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          color="primary.main"
                          sx={{ fontWeight: 500 }}
                        >
                          {t("memberCount", {
                            count: memberCounts[department.id] || 0,
                          })}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </Container>

        {/* Add Department FAB */}
        {canManageDepartments && (
          <Fab
            color="primary"
            aria-label="add department"
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
            }}
            onClick={() => handleOpenDepartmentDialog()}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Department Create/Edit Dialog */}
        <Dialog
          open={departmentDialogOpen}
          onClose={handleCloseDepartmentDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingDepartment ? "Edit Department" : "Add Department"}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={departmentFormData.name}
              onChange={(e) =>
                setDepartmentFormData({
                  ...departmentFormData,
                  name: e.target.value,
                })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={departmentFormData.description}
              onChange={(e) =>
                setDepartmentFormData({
                  ...departmentFormData,
                  description: e.target.value,
                })
              }
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="Image URL"
              value={departmentFormData.image_url}
              onChange={(e) =>
                setDepartmentFormData({
                  ...departmentFormData,
                  image_url: e.target.value,
                })
              }
              margin="normal"
              helperText="URL to department image"
            />
            <TextField
              fullWidth
              label="Display Order"
              type="number"
              value={departmentFormData.display_order}
              onChange={(e) =>
                setDepartmentFormData({
                  ...departmentFormData,
                  display_order: parseInt(e.target.value) || 0,
                })
              }
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDepartmentDialog}>Cancel</Button>
            <Button onClick={handleSaveDepartment} variant="contained">
              {editingDepartment ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};





