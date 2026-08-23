-- ============================================================================
-- Rate Information Schema for Reservations
-- ============================================================================
-- This migration adds comprehensive rate information fields to the reservations table
-- to support detailed pricing breakdowns with discounts, taxes, and service charges.
--
-- Note: This app currently uses Zustand for state management (demo mode).
-- This schema is provided for reference if migrating to a real Supabase backend.
-- ============================================================================

-- Add rate information columns to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'Standard';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rate_code TEXT DEFAULT 'BAR';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS room_rate NUMERIC DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS nights INTEGER DEFAULT 1 CHECK (nights > 0);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 1 CHECK (adults > 0);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0 CHECK (children >= 0);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS meal_plan TEXT DEFAULT 'RO';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tax_percent NUMERIC DEFAULT 0 CHECK (tax_percent >= 0 AND tax_percent <= 100);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS service_charge_percent NUMERIC DEFAULT 0 CHECK (service_charge_percent >= 0 AND service_charge_percent <= 100);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0 CHECK (total_amount >= 0);

-- Add comments for documentation
COMMENT ON COLUMN reservations.room_type IS 'Room category: Standard, Deluxe, Twin, Suite';
COMMENT ON COLUMN reservations.rate_code IS 'Rate code identifier (e.g., BAR, CORP, BB)';
COMMENT ON COLUMN reservations.room_rate IS 'Base rate per night before discounts';
COMMENT ON COLUMN reservations.nights IS 'Number of nights for the stay';
COMMENT ON COLUMN reservations.adults IS 'Number of adult guests';
COMMENT ON COLUMN reservations.children IS 'Number of child guests';
COMMENT ON COLUMN reservations.meal_plan IS 'Meal plan: RO (Room Only), BB (Bed & Breakfast), HB (Half Board), FB (Full Board)';
COMMENT ON COLUMN reservations.currency IS 'Currency code (ETB, USD, etc.)';
COMMENT ON COLUMN reservations.discount_percent IS 'Discount percentage applied to room charge';
COMMENT ON COLUMN reservations.tax_percent IS 'Tax percentage applied after discount';
COMMENT ON COLUMN reservations.service_charge_percent IS 'Service charge percentage applied after discount';
COMMENT ON COLUMN reservations.total_amount IS 'Final calculated total amount including all charges';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_reservations_rate_code ON reservations(rate_code);
CREATE INDEX IF NOT EXISTS idx_reservations_currency ON reservations(currency);

-- ============================================================================
-- CALCULATION FORMULA (implemented in frontend)
-- ============================================================================
-- room_charge = room_rate × nights
-- discount_amount = room_charge × (discount_percent / 100)
-- after_discount = room_charge − discount_amount
-- tax_amount = after_discount × (tax_percent / 100)
-- service_charge_amount = after_discount × (service_charge_percent / 100)
-- total_amount = after_discount + tax_amount + service_charge_amount
--
-- Example: room_rate=1000, nights=2, discount=10%, tax=15%, service=10%
-- → room_charge=2000 → discount=200 → after_discount=1800
-- → tax=270 → service_charge=180 → total=2250.00
-- ============================================================================
