import type { Donation } from "../types";

/**
 * Tax credit rates for Quebec residents
 * First $200: Federal 15% + Quebec 20% = 35%
 * Above $200: Federal 29% (or 33% for top bracket) + Quebec 24% (or 25.75% for top bracket)
 */
interface TaxRates {
  fFed: number; // Federal rate for first $200
  hFed: number; // Federal rate above $200 (29% standard, 33% top bracket)
  fQc: number;  // Quebec rate for first $200
  hQc: number;  // Quebec rate above $200 (24% standard, 25.75% top bracket)
}

/**
 * Calculate tax credit for a single donation amount
 * Uses the two-tier system: first $200 at lower rates, remainder at higher rates
 * 
 * @param D - Donation amount
 * @param rates - Tax rates (defaults to standard rates, can be overridden for high income)
 * @returns Tax credit amount
 */
export function donationCredit(
  D: number,
  rates: TaxRates = {
    fFed: 0.15,
    hFed: 0.29,   // change to 0.33 for top federal bracket
    fQc: 0.20,
    hQc: 0.24     // change to 0.2575 for top Quebec bracket
  }
): number {
  const firstPortion = Math.min(D, 200) * (rates.fFed + rates.fQc);
  const higherPortion = Math.max(D - 200, 0) * (rates.hFed + rates.hQc);
  return firstPortion + higherPortion;
}

/**
 * Calculate effective donation percentage (tax credit as percentage of donation)
 * 
 * @param D - Donation amount
 * @param highIncome - Whether to use high income bracket rates (default: false)
 * @returns Effective tax credit percentage (e.g., 0.50 for 50%)
 */
export function effectiveDonationPercent(D: number, highIncome = false): number {
  const rates: TaxRates = highIncome
    ? { fFed: 0.15, hFed: 0.33, fQc: 0.20, hQc: 0.2575 }
    : { fFed: 0.15, hFed: 0.29, fQc: 0.20, hQc: 0.24 };

  const credit = donationCredit(D, rates);
  return D > 0 ? credit / D : 0;
}

/**
 * Calculate Canadian tax credit for charitable donations (Quebec residents)
 * NOTE: This is an estimate and only applicable for Canadians residing in Quebec.
 * 
 * Uses the two-tier tax credit system:
 * - First $200: 15% federal + 20% Quebec = 35%
 * - Above $200: 29% federal + 24% Quebec = 53% (or higher rates for top bracket)
 * 
 * @param donations - Array of donations for the tax year
 * @param taxYear - The tax year (e.g., 2024)
 * @param highIncome - Whether to use high income bracket rates (default: false)
 * @returns Total estimated tax credit amount
 */
export function calculateTaxCredit(
  donations: Donation[],
  taxYear: number,
  highIncome: boolean = false
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

  // Calculate tax credit using the two-tier system
  return donationCredit(totalAmount, highIncome ? {
    fFed: 0.15,
    hFed: 0.33,
    fQc: 0.20,
    hQc: 0.2575
  } : {
    fFed: 0.15,
    hFed: 0.29,
    fQc: 0.20,
    hQc: 0.24
  });
}

/**
 * Get tax credit breakdown by category
 * NOTE: This is an estimate and only applicable for Canadians residing in Quebec.
 * 
 * @param donations - Array of donations for the tax year
 * @param taxYear - The tax year
 * @param highIncome - Whether to use high income bracket rates (default: false)
 * @returns Object with category names as keys and tax credit amounts as values
 */
export function getTaxCreditByCategory(
  donations: Donation[],
  taxYear: number,
  highIncome: boolean = false
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
    // Calculate tax credit for this donation amount
    const credit = donationCredit(Number(donation.amount), highIncome ? {
      fFed: 0.15,
      hFed: 0.33,
      fQc: 0.20,
      hQc: 0.2575
    } : {
      fFed: 0.15,
      hFed: 0.29,
      fQc: 0.20,
      hQc: 0.24
    });
    byCategory[categoryName] += credit;
  });

  return byCategory;
}

