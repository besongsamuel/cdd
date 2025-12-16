-- Add start_date and end_date columns to regular_programs table for recurring programs
-- If end_date is NULL, the program repeats indefinitely
ALTER TABLE regular_programs
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add comment to explain the recurring behavior
COMMENT ON COLUMN regular_programs.start_date IS 'Start date for recurring programs. If NULL, program starts immediately.';
COMMENT ON COLUMN regular_programs.end_date IS 'End date for recurring programs. If NULL, program repeats indefinitely.';



