import InfoIcon from "@mui/icons-material/Info";
import PeopleIcon from "@mui/icons-material/People";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PassionsAutocomplete } from "../components/common/PassionsAutocomplete";
import { ProfilePictureUpload } from "../components/common/ProfilePictureUpload";
import { useAuth } from "../hooks/useAuth";
import { membersService } from "../services/membersService";
import { profileService } from "../services/profileService";
import { titlesService } from "../services/titlesService";
import type { Title } from "../types";

export const CompleteProfilePage = () => {
  const { t } = useTranslation("common");
  const { user, currentMember, getCurrentMember } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState("");
  const [titleId, setTitleId] = useState<string>("");
  const [passions, setPassions] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [landscapePicture, setLandscapePicture] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLandscape, setUploadingLandscape] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Load titles
        const titlesData = await titlesService.getAll();
        setTitles(titlesData);

        // Load current member data if exists
        const member = await getCurrentMember();
        if (member) {
          setName(member.name);
          setBio(member.bio || "");
          setTitleId(member.title_id || "");
          setPassions(member.passions || []);
        } else {
          // If no member exists, set default name from user email
          const defaultName = user.email?.split("@")[0] || "Member";
          setName(defaultName);
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate, getCurrentMember]);

  const handleProfilePictureSelected = (file: File) => {
    setProfilePicture(file);
  };

  const handleProfilePictureRemove = () => {
    setProfilePicture(null);
  };

  const handleLandscapePictureSelected = (file: File) => {
    setLandscapePicture(file);
  };

  const handleLandscapePictureRemove = () => {
    setLandscapePicture(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!user) {
        throw new Error("User not found");
      }

      let profilePictureUrl: string | undefined;
      let landscapePictureUrl: string | undefined;

      let memberId: string;

      if (currentMember) {
        // Update existing member profile
        memberId = currentMember.id;

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
          profilePictureUrl = currentMember.picture_url;
        }

        // Upload landscape picture if provided and member is a leader
        if (landscapePicture && currentMember.type === "leader") {
          setUploadingLandscape(true);
          try {
            landscapePictureUrl = await profileService.uploadLandscapePicture(
              landscapePicture,
              memberId
            );
          } finally {
            setUploadingLandscape(false);
          }
        } else {
          landscapePictureUrl = currentMember.landscape_picture_url;
        }

        // Update member profile
        await membersService.update(memberId, {
          bio: bio || undefined,
          title_id: titleId || undefined,
          passions: passions.length > 0 ? passions : undefined,
          picture_url: profilePictureUrl,
          landscape_picture_url: landscapePictureUrl,
        });
      } else {
        // Create new member profile first (with basic info)
        if (!name.trim()) {
          throw new Error("Name is required");
        }

        const newMember = await membersService.create({
          name: name.trim(),
          type: "regular",
          user_id: user.id,
          is_admin: false,
          bio: bio || undefined,
          title_id: titleId || undefined,
          passions: passions.length > 0 ? passions : undefined,
        });

        memberId = newMember.id;

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

        // Upload landscape picture if provided (for leaders)
        if (landscapePicture) {
          setUploadingLandscape(true);
          try {
            landscapePictureUrl = await profileService.uploadLandscapePicture(
              landscapePicture,
              memberId
            );
            // Update member with landscape picture URL
            await membersService.update(memberId, {
              landscape_picture_url: landscapePictureUrl,
            });
          } finally {
            setUploadingLandscape(false);
          }
        }
      }

      // Refresh current member
      await getCurrentMember();

      // Show success message instead of redirecting
      setSuccess(true);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const isLeader = currentMember?.type === "leader";

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={600}>
            {t("completeProfile")}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", mt: 2 }}
          >
            {t("completeProfileDescription")}
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}
            >
              <InfoIcon color="primary" sx={{ mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t("whyCompleteProfile")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("whyCompleteProfileDescription")}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ p: 4 }}>
          {success ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                {t("profileSavedSuccessfully")}
              </Alert>
              <Typography variant="h6" gutterBottom>
                {t("profileComplete")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t("profileCompleteMessage")}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/")}
                sx={{ minWidth: 150 }}
              >
                {t("goToHome")}
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Name (only show if creating new member) */}
              {!currentMember && (
                <TextField
                  fullWidth
                  label={t("name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  margin="normal"
                  helperText={t("required")}
                />
              )}

              {/* Bio */}
              <TextField
                fullWidth
                label={t("bio")}
                multiline
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                margin="normal"
                helperText={t("bioHelperDetailed")}
                placeholder={t("bioPlaceholder")}
              />

              {/* Title */}
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("title")}</InputLabel>
                <Select
                  value={titleId}
                  label={t("title")}
                  onChange={(e) => setTitleId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t("none")}</em>
                  </MenuItem>
                  {titles.map((title) => (
                    <MenuItem key={title.id} value={title.id}>
                      {title.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 4 }} />

              {/* Profile Picture */}
              <Box sx={{ mb: 4 }}>
                <ProfilePictureUpload
                  currentImageUrl={currentMember?.picture_url}
                  onImageSelected={handleProfilePictureSelected}
                  onImageRemove={handleProfilePictureRemove}
                  uploading={uploadingProfile}
                  label={t("profilePicture")}
                  size="medium"
                  aspectRatio="square"
                />
              </Box>

              {/* Landscape Picture (Leaders only) */}
              {isLeader && (
                <Box sx={{ mb: 4 }}>
                  <ProfilePictureUpload
                    currentImageUrl={currentMember?.landscape_picture_url}
                    onImageSelected={handleLandscapePictureSelected}
                    onImageRemove={handleLandscapePictureRemove}
                    uploading={uploadingLandscape}
                    label={t("landscapePicture")}
                    size="large"
                    aspectRatio="landscape"
                  />
                </Box>
              )}

              <Divider sx={{ my: 4 }} />

              {/* Passions Section */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <PeopleIcon color="primary" sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {t("passions")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {t("whyPassionsImportant")}
                    </Typography>
                    <PassionsAutocomplete
                      value={passions}
                      onChange={setPassions}
                      label={t("passions")}
                    />
                  </Box>
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 4,
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving || uploadingProfile || uploadingLandscape}
                  sx={{ minWidth: 150 }}
                >
                  {saving ? t("saving") : t("saveProfile")}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
