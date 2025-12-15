-- Seed financial transparency data for current year (2024)
INSERT INTO financial_years (year, total_donations, total_expenses, budget_breakdown, is_active) VALUES
  (
    2024,
    125000.00,
    118000.00,
    $json${
      "ministry_programs": 45,
      "community_outreach": 20,
      "staff_administration": 25,
      "facilities_operations": 10
    }$json$::jsonb,
    true
  );


