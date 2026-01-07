import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { stripeService } from "../services/stripeService";
import { subscriptionService } from "../services/subscriptionService";
import type { StripeSubscription } from "../types";

export const SubscriptionManagement = () => {
  const { t } = useTranslation("donations");
  const { currentMember, user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<StripeSubscription | null>(null);

  useEffect(() => {
    if (currentMember?.id || user?.email) {
      loadSubscriptions();
    }
  }, [currentMember?.id, user?.email]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      let data: StripeSubscription[] = [];

      if (currentMember?.id) {
        data = await subscriptionService.getByMemberId(currentMember.id);
      } else if (user?.email) {
        data = await subscriptionService.getByEmail(user.email);
      }

      setSubscriptions(data);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async (subscription: StripeSubscription) => {
    try {
      setOpeningPortal(subscription.id);
      const { url } = await stripeService.createCustomerPortalSession(
        subscription.stripe_customer_id
      );
      window.location.href = url;
    } catch (error) {
      console.error("Error opening portal:", error);
      alert("Failed to open subscription management portal");
    } finally {
      setOpeningPortal(null);
    }
  };

  const handleCancelClick = (subscription: StripeSubscription) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSubscription) return;

    // Open portal for cancellation (Stripe handles cancellation through portal)
    await handleOpenPortal(selectedSubscription);
    setCancelDialogOpen(false);
    setSelectedSubscription(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active"
  );

  if (activeSubscriptions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t("subscriptionManagement") || "Subscription Management"}
        </Typography>
        <Alert severity="info">
          You don't have any active subscriptions.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t("subscriptionManagement") || "Subscription Management"}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {activeSubscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {subscription.category_name || "General Donation"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${Number(subscription.amount).toLocaleString("en-CA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    per month
                  </Typography>
                  {subscription.current_period_end && (
                    <Typography variant="body2" color="text.secondary">
                      Next billing date:{" "}
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()}
                    </Typography>
                  )}
                  {subscription.cancel_at_period_end && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      This subscription will be canceled at the end of the
                      current period.
                    </Alert>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenPortal(subscription)}
                    disabled={openingPortal === subscription.id}
                  >
                    {openingPortal === subscription.id
                      ? "Opening..."
                      : "Manage"}
                  </Button>
                  {!subscription.cancel_at_period_end && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleCancelClick(subscription)}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will be redirected to the Stripe Customer Portal to cancel your
            subscription. The subscription will remain active until the end of
            the current billing period.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

