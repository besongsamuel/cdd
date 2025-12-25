import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DraggableProfileImage } from "../components/common/DraggableProfileImage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { useHasPermission } from "../hooks/usePermissions";
import { membersService } from "../services/membersService";
import { titlesService } from "../services/titlesService";
import type { Member, MemberType, Title } from "../types";

// Component for Leader Card with image error handling
const LeaderCard = ({
  leader,
  canManageMembers,
  onPositionUpdate,
  isCurrentMemberVerified,
  currentMemberId,
  onEdit,
  onDelete,
}: {
  leader: Member;
  canManageMembers: boolean;
  onPositionUpdate: (
    memberId: string,
    position: { x: number; y: number }
  ) => Promise<void>;
  isCurrentMemberVerified: boolean;
  currentMemberId?: string;
  onEdit?: (member: Member) => void;
  onDelete?: (memberId: string) => void;
}) => {
  const [position, setPosition] = useState(
    leader.profile_picture_position || { x: 50, y: 50 }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);

  const handlePositionChange = async (newPosition: {
    x: number;
    y: number;
  }) => {
    setPosition(newPosition);
    setIsSaving(true);
    try {
      await onPositionUpdate(leader.id, newPosition);
    } catch (error) {
      console.error("Failed to save position:", error);
      // Revert to original position on error
      setPosition(leader.profile_picture_position || { x: 50, y: 50 });
    } finally {
      setIsSaving(false);
    }
  };

  // Format display name with title (unless "Regular Member" or empty)
  const getDisplayName = (member: Member): string => {
    if (
      member.title_name &&
      member.title_name.trim() !== "" &&
      member.title_name.toLowerCase() !== "regular member"
    ) {
      return `${member.title_name} ${member.name}`;
    }
    return member.name;
  };

  return (
    <Card sx={{ position: "relative" }}>
      {isSaving && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 10,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 1,
            p: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="caption">Saving...</Typography>
        </Box>
      )}
      {!leader.picture_url ? (
        <Box
          sx={{
            height: { xs: 200, sm: 250 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f7",
          }}
        >
          <Box
            sx={{
              width: { xs: 120, sm: 150 },
              height: { xs: 120, sm: 150 },
              color: "primary.main",
            }}
          >
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "100%" }}
            >
              {/* Person vector illustration - simple and clean */}
              {/* Head circle */}
              <circle
                cx="50"
                cy="30"
                r="14"
                fill="currentColor"
                opacity="0.12"
              />
              <circle
                cx="50"
                cy="30"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />

              {/* Body shape (rounded trapezoid) */}
              <path
                d="M 32 48 Q 32 52 50 52 Q 68 52 68 48 L 68 75 Q 68 80 50 80 Q 32 80 32 75 Z"
                fill="currentColor"
                opacity="0.12"
              />
              <path
                d="M 32 48 Q 32 52 50 52 Q 68 52 68 48 L 68 75 Q 68 80 50 80 Q 32 80 32 75 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
        </Box>
      ) : (
        <DraggableProfileImage
          imageUrl={leader.picture_url}
          alt={getDisplayName(leader)}
          position={position}
          isEditable={canManageMembers}
          onPositionChange={handlePositionChange}
          height={250}
        />
      )}
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: leader.bio ? 1 : 0,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
            {getDisplayName(leader)}
          </Typography>
          {leader.user_id && (
            <Tooltip title="Verified member" arrow>
              <VerifiedIcon
                sx={{
                  fontSize: 18,
                  color: "primary.main",
                  opacity: 0.7,
                }}
              />
            </Tooltip>
          )}
          {canManageMembers && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={() => onEdit(leader)}
                  sx={{ color: "primary.main" }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(leader.id)}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
        {leader.bio && (
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 10,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                mb: leader.bio.length > 500 ? 0.5 : 0,
              }}
            >
              {leader.bio}
            </Typography>
            {leader.bio.length > 500 && (
              <Button
                size="small"
                onClick={() => setBioDialogOpen(true)}
                sx={{
                  mt: 0.5,
                  textTransform: "none",
                  fontSize: "0.75rem",
                  minWidth: "auto",
                  p: 0,
                  color: "primary.main",
                }}
              >
                More
              </Button>
            )}
          </Box>
        )}
        {(leader.email || leader.phone) && (
          <Box
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            {leader.email && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  filter:
                    !isCurrentMemberVerified && leader.id !== currentMemberId
                      ? "blur(8px)"
                      : "none",
                  userSelect:
                    !isCurrentMemberVerified && leader.id !== currentMemberId
                      ? "none"
                      : "auto",
                  pointerEvents:
                    !isCurrentMemberVerified && leader.id !== currentMemberId
                      ? "none"
                      : "auto",
                }}
              >
                📧 {leader.email}
              </Typography>
            )}
            {leader.phone && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  filter:
                    !isCurrentMemberVerified && leader.id !== currentMemberId
                      ? "blur(8px)"
                      : "none",
                  userSelect:
                    !isCurrentMemberVerified && leader.id !== currentMemberId
                      ? "none"
                      : "auto",
                  pointerEvents:
                    !isCurrentMemberVerified && leader.id !== currentMemberId
                      ? "none"
                      : "auto",
                }}
              >
                📞 {leader.phone}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
      {leader.bio && (
        <Dialog
          open={bioDialogOpen}
          onClose={() => setBioDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{getDisplayName(leader)}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" color="text.secondary">
              {leader.bio}
            </Typography>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export const MembersPage = () => {
  const { t } = useTranslation("members");
  const { currentMember } = useAuth();
  const canManageMembers = useHasPermission("manage:members");
  const isCurrentMemberVerified = currentMember?.is_verified ?? false;
  const [leaders, setLeaders] = useState<Member[]>([]);
  const [regularMembers, setRegularMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPassion, setSelectedPassion] = useState<string | null>(null);
  const [selectedMemberPhoto, setSelectedMemberPhoto] = useState<Member | null>(
    null
  );
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);
  const [memberFormData, setMemberFormData] = useState({
    name: "",
    type: "regular" as MemberType,
    bio: "",
    email: "",
    phone: "",
    title_id: "" as string | undefined,
  });

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const [leadersData, regularData, titlesData] = await Promise.all([
          membersService.getLeaders(),
          membersService.getRegularMembers(),
          titlesService.getAll(),
        ]);
        setLeaders(leadersData);
        setRegularMembers(regularData);
        setTitles(titlesData);
      } catch (error) {
        console.error("Error loading members:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  const handlePositionUpdate = async (
    memberId: string,
    position: { x: number; y: number }
  ) => {
    await membersService.update(memberId, {
      profile_picture_position: position,
    });
    // Refresh leaders list to get updated data
    const leadersData = await membersService.getLeaders();
    setLeaders(leadersData);
  };

  const handleOpenMemberDialog = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setMemberFormData({
        name: member.name,
        type: member.type,
        bio: member.bio || "",
        email: member.email || "",
        phone: member.phone || "",
        title_id: member.title_id || undefined,
      });
    } else {
      setEditingMember(null);
      setMemberFormData({
        name: "",
        type: "regular",
        bio: "",
        email: "",
        phone: "",
        title_id: undefined,
      });
    }
    setMemberDialogOpen(true);
  };

  const handleCloseMemberDialog = () => {
    setMemberDialogOpen(false);
    setEditingMember(null);
  };

  const handleSaveMember = async () => {
    try {
      if (editingMember) {
        await membersService.update(editingMember.id, memberFormData);
      } else {
        await membersService.create(memberFormData);
      }
      handleCloseMemberDialog();
      // Reload members
      const [leadersData, regularData] = await Promise.all([
        membersService.getLeaders(),
        membersService.getRegularMembers(),
      ]);
      setLeaders(leadersData);
      setRegularMembers(regularData);
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to save member");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to delete this member?")) {
      return;
    }
    try {
      await membersService.delete(memberId);
      // Reload members
      const [leadersData, regularData] = await Promise.all([
        membersService.getLeaders(),
        membersService.getRegularMembers(),
      ]);
      setLeaders(leadersData);
      setRegularMembers(regularData);
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Failed to delete member");
    }
  };

  // Calculate passion frequencies for word cloud
  const passionFrequencies = (() => {
    const allMembers = [...leaders, ...regularMembers];
    const frequencies: Record<string, number> = {};

    allMembers.forEach((member) => {
      if (member.passions && member.passions.length > 0) {
        member.passions.forEach((passion) => {
          const normalized = passion.trim();
          if (normalized) {
            frequencies[normalized] = (frequencies[normalized] || 0) + 1;
          }
        });
      }
    });

    return frequencies;
  })();

  // Convert to array and sort by frequency
  const sortedPassions = Object.entries(passionFrequencies)
    .map(([passion, count]) => ({ passion, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate font size based on frequency (scale between min and max)
  const getFontSize = (count: number, maxCount: number) => {
    if (maxCount === 0) return 14;
    const minSize = 14;
    const maxSize = 48;
    const ratio = count / maxCount;
    return minSize + (maxSize - minSize) * ratio;
  };

  // Color palette for word cloud - gradient-inspired colors
  const colors = [
    "#1e3a8a", // Primary blue
    "#2563eb", // Bright blue
    "#3b82f6", // Light blue
    "#06b6d4", // Cyan
    "#10b981", // Green
    "#059669", // Dark green
    "#8b5cf6", // Purple
    "#7c3aed", // Dark purple
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#dc2626", // Dark red
  ];

  const getColor = (index: number) => {
    return colors[index % colors.length];
  };

  // Generate random rotation for visual interest
  const getRotation = (index: number) => {
    const rotations = [-5, -3, -2, 0, 2, 3, 5];
    return rotations[index % rotations.length];
  };

  const maxFrequency = sortedPassions[0]?.count || 0;

  // Filter members based on search query and selected passion
  const filterMembers = (members: Member[]) => {
    return members.filter((member) => {
      // Filter by selected passion
      if (selectedPassion) {
        const hasPassion =
          member.passions &&
          member.passions.some(
            (p) => p.toLowerCase() === selectedPassion.toLowerCase()
          );
        if (!hasPassion) return false;
      }

      // Filter by search query (name, email, or passion)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = member.name?.toLowerCase().includes(query);
        const emailMatch = member.email?.toLowerCase().includes(query);
        const passionMatch =
          member.passions &&
          member.passions.some((p) => p.toLowerCase().includes(query));
        return nameMatch || emailMatch || passionMatch;
      }

      return true;
    });
  };

  const filteredLeaders = filterMembers(leaders);
  // Combine leaders and regular members for the members list (leaders should also appear)
  const filteredAllMembers = filterMembers([...leaders, ...regularMembers]);

  const handlePassionClick = (passion: string) => {
    if (selectedPassion === passion) {
      // If clicking the same passion, clear the filter
      setSelectedPassion(null);
    } else {
      // Set the selected passion
      setSelectedPassion(passion);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title={t("title")} description={t("title")} url="/members" />
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
            viewBox="0 0 1200 1200"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            {/* People silhouettes in community */}
            <g transform="translate(150, 200)">
              <circle cx="0" cy="0" r="30" fill="#2563eb" opacity="0.4" />
              <path
                d="M -20 40 Q -20 55 0 60 Q 20 55 20 40 L 20 70 Q 20 85 0 90 Q -20 85 -20 70 Z"
                fill="#3b82f6"
                opacity="0.4"
              />
            </g>
            <g transform="translate(300, 180)">
              <circle cx="0" cy="0" r="32" fill="#3b82f6" opacity="0.4" />
              <path
                d="M -22 42 Q -22 57 0 62 Q 22 57 22 42 L 22 72 Q 22 87 0 92 Q -22 87 -22 72 Z"
                fill="#60a5fa"
                opacity="0.4"
              />
            </g>
            <g transform="translate(450, 200)">
              <circle cx="0" cy="0" r="28" fill="#60a5fa" opacity="0.4" />
              <path
                d="M -18 38 Q -18 53 0 58 Q 18 53 18 38 L 18 68 Q 18 83 0 88 Q -18 83 -18 68 Z"
                fill="#2563eb"
                opacity="0.4"
              />
            </g>

            {/* More people in different positions */}
            <g transform="translate(850, 250)">
              <circle cx="0" cy="0" r="30" fill="#3b82f6" opacity="0.35" />
              <path
                d="M -20 40 Q -20 55 0 60 Q 20 55 20 40 L 20 70 Q 20 85 0 90 Q -20 85 -20 70 Z"
                fill="#2563eb"
                opacity="0.35"
              />
            </g>
            <g transform="translate(1000, 230)">
              <circle cx="0" cy="0" r="28" fill="#2563eb" opacity="0.35" />
              <path
                d="M -18 38 Q -18 53 0 58 Q 18 53 18 38 L 18 68 Q 18 83 0 88 Q -18 83 -18 68 Z"
                fill="#60a5fa"
                opacity="0.35"
              />
            </g>

            {/* Hearts representing love/community */}
            <g transform="translate(600, 150)">
              <path
                d="M 0 20 C -15 -10 -30 -20 -20 -35 C -10 -30 0 -20 0 -10 C 0 -20 10 -30 20 -35 C 30 -20 15 -10 0 20 Z"
                fill="#ec4899"
                opacity="0.3"
              />
            </g>
            <g transform="translate(750, 400)">
              <path
                d="M 0 18 C -12 -8 -25 -18 -18 -32 C -8 -27 0 -18 0 -9 C 0 -18 8 -27 18 -32 C 25 -18 12 -8 0 18 Z"
                fill="#f472b6"
                opacity="0.25"
              />
            </g>

            {/* Connected dots representing relationships */}
            <g>
              <circle cx="200" cy="500" r="12" fill="#2563eb" opacity="0.4" />
              <circle cx="350" cy="520" r="10" fill="#3b82f6" opacity="0.4" />
              <circle cx="500" cy="500" r="14" fill="#60a5fa" opacity="0.4" />
              <circle cx="650" cy="515" r="11" fill="#2563eb" opacity="0.4" />
              <circle cx="800" cy="500" r="13" fill="#3b82f6" opacity="0.4" />
              <line
                x1="212"
                y1="500"
                x2="340"
                y2="518"
                stroke="#2563eb"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="360"
                y1="520"
                x2="490"
                y2="508"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="514"
                y1="500"
                x2="639"
                y2="513"
                stroke="#60a5fa"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="661"
                y1="515"
                x2="787"
                y2="508"
                stroke="#2563eb"
                strokeWidth="2"
                opacity="0.3"
              />
            </g>

            {/* Abstract community shapes */}
            <g transform="translate(400, 700)">
              <circle cx="0" cy="0" r="80" fill="#2563eb" opacity="0.15" />
              <circle cx="0" cy="0" r="50" fill="#3b82f6" opacity="0.2" />
              <circle cx="0" cy="0" r="25" fill="#60a5fa" opacity="0.3" />
            </g>

            {/* Sparkle effects */}
            <g transform="translate(250, 600)">
              <path
                d="M 0 -10 L 3 -3 L 10 -3 L 4 2 L 6 9 L 0 5 L -6 9 L -4 2 L -10 -3 L -3 -3 Z"
                fill="#fbbf24"
                opacity="0.4"
              />
            </g>
            <g transform="translate(900, 700)">
              <path
                d="M 0 -8 L 2.5 -2.5 L 8 -2.5 L 3 1.5 L 5 7.5 L 0 4 L -5 7.5 L -3 1.5 L -8 -2.5 L -2.5 -2.5 Z"
                fill="#f59e0b"
                opacity="0.35"
              />
            </g>
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
            sx={{ fontSize: { xs: "32px", md: "40px" } }}
          >
            {t("title")}
          </Typography>

          {/* Search Section */}
          <Box sx={{ mt: 4, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or passion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 600, mx: "auto", display: "block" }}
            />
            {selectedPassion && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Filtered by:
                </Typography>
                <Chip
                  label={selectedPassion}
                  onDelete={() => setSelectedPassion(null)}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>

          {/* Leaders Section - Grouped by Title */}
          <Box sx={{ mt: { xs: 4, md: 6 } }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{ fontSize: { xs: "24px", md: "32px" } }}
            >
              {t("leaders")}
            </Typography>
            {filteredLeaders.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {leaders.length === 0
                  ? t("noLeaders")
                  : "No leaders match your search"}
              </Typography>
            ) : (
              (() => {
                // Group leaders by title_name
                const groupedLeaders = filteredLeaders.reduce(
                  (acc, leader) => {
                    const title =
                      leader.title_name &&
                      leader.title_name.trim() !== "" &&
                      leader.title_name.toLowerCase() !== "regular member"
                        ? leader.title_name
                        : "Other Leaders";
                    if (!acc[title]) {
                      acc[title] = [];
                    }
                    acc[title].push(leader);
                    return acc;
                  },
                  {} as Record<string, Member[]>
                );

                // Custom sort order: Pastors, Elders, Deacons, Ministers, then others alphabetically
                const titleOrder = [
                  "Pastor",
                  "Pastors",
                  "Elder",
                  "Elders",
                  "Deacon",
                  "Deacons",
                  "Minister",
                  "Ministers",
                ];

                const getTitleOrder = (title: string): number => {
                  // Check for exact match first
                  const exactIndex = titleOrder.findIndex(
                    (t) => t.toLowerCase() === title.toLowerCase()
                  );
                  if (exactIndex !== -1) return exactIndex;

                  // Check if title contains any of the ordered words
                  const titleLower = title.toLowerCase();
                  for (let i = 0; i < titleOrder.length; i++) {
                    if (titleLower.includes(titleOrder[i].toLowerCase())) {
                      return i;
                    }
                  }

                  // If "Other Leaders", put at the end
                  if (title === "Other Leaders") return 999;

                  // Otherwise, sort alphabetically after ordered titles
                  return 100 + title.charCodeAt(0);
                };

                const sortedTitles = Object.keys(groupedLeaders).sort(
                  (a, b) => {
                    const orderA = getTitleOrder(a);
                    const orderB = getTitleOrder(b);
                    if (orderA !== orderB) return orderA - orderB;
                    // If same order, sort alphabetically
                    return a.localeCompare(b);
                  }
                );

                return sortedTitles.map((title, titleIndex) => (
                  <Box
                    key={title}
                    sx={{
                      mt: titleIndex === 0 ? 2 : { xs: 5, md: 6 },
                    }}
                  >
                    {/* Title Section Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                        position: "relative",
                        "&::after": {
                          content: '""',
                          flex: 1,
                          height: "2px",
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.3) 50%, transparent 100%)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 0.75,
                          backgroundColor: "primary.main",
                          color: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
                          fontWeight: 600,
                          fontSize: { xs: "16px", md: "18px" },
                          letterSpacing: "0.02em",
                        }}
                      >
                        {title}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontStyle: "italic",
                          fontSize: { xs: "12px", md: "14px" },
                        }}
                      >
                        {groupedLeaders[title].length}{" "}
                        {groupedLeaders[title].length === 1
                          ? "member"
                          : "members"}
                      </Typography>
                    </Box>

                    {/* Leaders Grid for this Title */}
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
                      {groupedLeaders[title].map((leader) => (
                        <LeaderCard
                          key={leader.id}
                          leader={leader}
                          canManageMembers={canManageMembers}
                          onPositionUpdate={handlePositionUpdate}
                          isCurrentMemberVerified={isCurrentMemberVerified}
                          currentMemberId={currentMember?.id}
                          onEdit={canManageMembers ? handleOpenMemberDialog : undefined}
                          onDelete={canManageMembers ? handleDeleteMember : undefined}
                        />
                      ))}
                    </Box>
                  </Box>
                ));
              })()
            )}
          </Box>

          {/* All Members Section */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{ fontSize: { xs: "24px", md: "32px" } }}
            >
              {t("members")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
                mt: 2,
              }}
            >
              {filteredAllMembers.length === 0 ? (
                <Typography color="text.secondary">
                  {leaders.length === 0 && regularMembers.length === 0
                    ? t("noMembers")
                    : "No members match your search"}
                </Typography>
              ) : (
                filteredAllMembers.map((member) => {
                  // Format display name with title (unless "Regular Member" or empty)
                  const getDisplayName = (m: Member): string => {
                    if (
                      m.title_name &&
                      m.title_name.trim() !== "" &&
                      m.title_name.toLowerCase() !== "regular member"
                    ) {
                      return `${m.title_name} ${m.name}`;
                    }
                    return m.name;
                  };

                  return (
                    <Card key={member.id}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 1,
                          }}
                        >
                          <Avatar
                            src={member.picture_url}
                            alt={member.name}
                            sx={{
                              width: 40,
                              height: 40,
                              cursor: member.picture_url
                                ? "pointer"
                                : "default",
                            }}
                            onClick={() => {
                              if (member.picture_url) {
                                setSelectedMemberPhoto(member);
                                setPhotoModalOpen(true);
                              }
                            }}
                          >
                            {member.name[0].toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{ flex: 1 }}
                          >
                            {getDisplayName(member)}
                          </Typography>
                          {member.user_id && (
                            <Tooltip title="Verified member" arrow>
                              <VerifiedIcon
                                sx={{
                                  fontSize: 16,
                                  color: "primary.main",
                                  opacity: 0.7,
                                }}
                              />
                            </Tooltip>
                          )}
                          {canManageMembers && (
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenMemberDialog(member)}
                                sx={{ color: "primary.main" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMember(member.id)}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                        {(member.email || member.phone) && (
                          <Box
                            sx={{
                              mt: 0.5,
                              mb: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            {member.email && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  filter:
                                    !isCurrentMemberVerified &&
                                    member.id !== currentMember?.id
                                      ? "blur(8px)"
                                      : "none",
                                  userSelect:
                                    !isCurrentMemberVerified &&
                                    member.id !== currentMember?.id
                                      ? "none"
                                      : "auto",
                                  pointerEvents:
                                    !isCurrentMemberVerified &&
                                    member.id !== currentMember?.id
                                      ? "none"
                                      : "auto",
                                }}
                              >
                                📧 {member.email}
                              </Typography>
                            )}
                            {member.phone && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  filter:
                                    !isCurrentMemberVerified &&
                                    member.id !== currentMember?.id
                                      ? "blur(8px)"
                                      : "none",
                                  userSelect:
                                    !isCurrentMemberVerified &&
                                    member.id !== currentMember?.id
                                      ? "none"
                                      : "auto",
                                  pointerEvents:
                                    !isCurrentMemberVerified &&
                                    member.id !== currentMember?.id
                                      ? "none"
                                      : "auto",
                                }}
                              >
                                📞 {member.phone}
                              </Typography>
                            )}
                          </Box>
                        )}
                        {member.passions && member.passions.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            {member.passions.map((passion, index) => (
                              <Chip
                                key={index}
                                label={passion}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Word Cloud Section */}
          {sortedPassions.length > 0 && (
            <Box sx={{ mt: { xs: 8, md: 12 } }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                textAlign="center"
                sx={{
                  fontSize: { xs: "24px", md: "32px" },
                  mb: 1,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {t("passionWordCloud")}
              </Typography>
              <Typography
                variant="body2"
                textAlign="center"
                color="text.secondary"
                sx={{
                  mb: 4,
                  fontStyle: "italic",
                  fontSize: { xs: "13px", md: "14px" },
                }}
              >
                Click on a word to view members who share that passion
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 2, sm: 2.5, md: 3 },
                  justifyContent: "center",
                  alignItems: "center",
                  py: { xs: 4, md: 6 },
                  px: { xs: 3, sm: 4, md: 5 },
                  background:
                    "linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%)",
                  borderRadius: 3,
                  boxShadow: "0 2px 20px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(30, 58, 138, 0.3) 50%, transparent 100%)",
                  },
                }}
              >
                {sortedPassions.map(({ passion, count }, index) => {
                  const isSelected = selectedPassion === passion;
                  return (
                    <Box
                      key={passion}
                      component="span"
                      onClick={() => handlePassionClick(passion)}
                      sx={{
                        display: "inline-block",
                        fontSize: `${getFontSize(count, maxFrequency)}px`,
                        fontWeight:
                          count >= maxFrequency * 0.7
                            ? 700
                            : count >= maxFrequency * 0.4
                              ? 600
                              : 500,
                        color: isSelected ? "#1e3a8a" : getColor(index),
                        opacity: isSelected
                          ? 1
                          : 0.9 + (count / maxFrequency) * 0.1,
                        transform: isSelected
                          ? "rotate(0deg) scale(1.15)"
                          : `rotate(${getRotation(index)}deg)`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
                        lineHeight: 1.2,
                        textShadow: isSelected
                          ? "0 2px 8px rgba(30, 58, 138, 0.3)"
                          : count >= maxFrequency * 0.5
                            ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                            : "none",
                        px: { xs: 0.5, sm: 1 },
                        py: 0.5,
                        backgroundColor: isSelected
                          ? "rgba(30, 58, 138, 0.1)"
                          : "transparent",
                        borderRadius: 1,
                        border: isSelected
                          ? "2px solid #1e3a8a"
                          : "2px solid transparent",
                        "&:hover": {
                          opacity: 1,
                          transform: "rotate(0deg) scale(1.12)",
                          textShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          zIndex: 1,
                          backgroundColor: "rgba(30, 58, 138, 0.08)",
                        },
                      }}
                    >
                      {passion}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      {/* Profile Picture Modal */}
      <Dialog
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          {selectedMemberPhoto?.picture_url && (
            <>
              <Box
                component="img"
                src={selectedMemberPhoto.picture_url}
                alt={selectedMemberPhoto.name}
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  borderRadius: 1,
                }}
              />
              <IconButton
                onClick={() => setPhotoModalOpen(false)}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  right: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" component="div">
                  {selectedMemberPhoto.title_name &&
                  selectedMemberPhoto.title_name.trim() !== "" &&
                  selectedMemberPhoto.title_name.toLowerCase() !==
                    "regular member"
                    ? `${selectedMemberPhoto.title_name} ${selectedMemberPhoto.name}`
                    : selectedMemberPhoto.name}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member FAB */}
      {canManageMembers && (
        <Fab
          color="primary"
          aria-label="add member"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
          }}
          onClick={() => handleOpenMemberDialog()}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Member Create/Edit Dialog */}
      <Dialog
        open={memberDialogOpen}
        onClose={handleCloseMemberDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMember ? "Edit Member" : "Add Member"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={memberFormData.name}
            onChange={(e) =>
              setMemberFormData({ ...memberFormData, name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={memberFormData.email}
            onChange={(e) =>
              setMemberFormData({ ...memberFormData, email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            value={memberFormData.phone}
            onChange={(e) =>
              setMemberFormData({ ...memberFormData, phone: e.target.value })
            }
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={memberFormData.type}
              onChange={(e) =>
                setMemberFormData({
                  ...memberFormData,
                  type: e.target.value as MemberType,
                })
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
              value={memberFormData.title_id || ""}
              onChange={(e) =>
                setMemberFormData({
                  ...memberFormData,
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
          {memberFormData.type === "leader" && (
            <TextField
              fullWidth
              label="Bio"
              value={memberFormData.bio}
              onChange={(e) =>
                setMemberFormData({ ...memberFormData, bio: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMemberDialog}>Cancel</Button>
          <Button onClick={handleSaveMember} variant="contained">
            {editingMember ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
