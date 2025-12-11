import { Box, Card, CardContent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { contactService } from "../../services/contactService";
import { donationsService } from "../../services/donationsService";
import { eventsService } from "../../services/eventsService";
import { membersService } from "../../services/membersService";
import { requestsService } from "../../services/requestsService";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    pendingRequests: 0,
    contactSubmissions: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
    pendingDonations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [members, events, requests, contacts, donationStats] =
          await Promise.all([
            membersService.getAll(),
            eventsService.getAll(),
            requestsService.getAll(),
            contactService.getAll(),
            donationsService
              .getStats()
              .catch(() => ({ total: 0, totalAmount: 0, byStatus: {} })),
          ]);

        setStats({
          members: members.length,
          events: events.length,
          pendingRequests: requests.filter((r) => r.status === "pending")
            .length,
          contactSubmissions: contacts.length,
          totalDonations: donationStats.total || 0,
          totalDonationAmount: donationStats.totalAmount || 0,
          pendingDonations:
            donationStats.byStatus && "pending" in donationStats.byStatus
              ? donationStats.byStatus.pending
              : 0,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: 3,
          mt: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Members
            </Typography>
            <Typography variant="h4">{stats.members}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Events
            </Typography>
            <Typography variant="h4">{stats.events}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Donations
            </Typography>
            <Typography variant="h4">{stats.totalDonations}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Donation Amount
            </Typography>
            <Typography variant="h4">
              ${stats.totalDonationAmount.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Pending Requests
            </Typography>
            <Typography variant="h4">{stats.pendingRequests}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Contact Submissions
            </Typography>
            <Typography variant="h4">{stats.contactSubmissions}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
