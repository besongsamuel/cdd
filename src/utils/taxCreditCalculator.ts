import type { Donation } from "../types";

/**
 * Calculate Canadian tax credit for charitable donations
 * Combined federal and provincial tax credits typically range from 50-59% of donation amount
 * 
 * @param donations - Array of donations for the tax year
 * @param taxYear - The tax year (e.g., 2024)
 * @param rate - Tax credit rate (default: 0.50 for 50%, typical range: 0.50-0.59)
 * @returns Total estimated tax credit amount
 */
export function calculateTaxCredit(
  donations: Donation[],
  taxYear: number,
  rate: number = 0.50
): number {
  // Filter donations for the tax year
  const yearDonations = donations.filter((donation) => {
    const donationYear = new Date(donation.created_at).getFullYear();
    return donationYear === taxYear;
  });

  // Calculate total donation amount
  const totalAmount = yearDonations.reduce(
    (sum, donation) => sum + Number(donation.amount),
    0
  );

  // Calculate tax credit
  return totalAmount * rate;
}

/**
 * Get tax credit breakdown by category
 * 
 * @param donations - Array of donations for the tax year
 * @param taxYear - The tax year
 * @param rate - Tax credit rate (default: 0.50)
 * @returns Object with category names as keys and tax credit amounts as values
 */
export function getTaxCreditByCategory(
  donations: Donation[],
  taxYear: number,
  rate: number = 0.50
): Record<string, number> {
  const yearDonations = donations.filter((donation) => {
    const donationYear = new Date(donation.created_at).getFullYear();
    return donationYear === taxYear;
  });

  const byCategory: Record<string, number> = {};

  yearDonations.forEach((donation) => {
    const categoryName = donation.category_name || "Unspecified";
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = 0;
    }
    byCategory[categoryName] += Number(donation.amount) * rate;
  });

  return byCategory;
}

