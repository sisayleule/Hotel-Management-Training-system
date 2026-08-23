-- ============================================================================
-- RESERVATIONS TABLE
-- InnSync Hotel Management Training PMS
-- ============================================================================

-- ============================================================================
-- STEP 1: Create reservation_status enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create reservations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_no        TEXT NOT NULL UNIQUE,         -- e.g. RES001
  guest_name            TEXT NOT NULL,
  company_code          TEXT DEFAULT '',
  room_type             TEXT NOT NULL DEFAULT 'STD',  -- STD | DLX | EXEC | SUI | FAM
  arrival               DATE NOT NULL,
  departure             DATE NOT NULL,
  nights                INTEGER NOT NULL DEFAULT 1,
  adults                INTEGER NOT NULL DEFAULT 1,
  children              INTEGER NOT NULL DEFAULT 0,
  pay_mode              TEXT NOT NULL DEFAULT 'Cash',
  status                reservation_status NOT NULL DEFAULT 'confirmed',
  rooms_assigned        TEXT[] DEFAULT '{}',           -- array of room_no strings
  rate                  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  special_notes         TEXT DEFAULT '',
  -- Rate information fields
  rate_code             TEXT DEFAULT 'BAR',
  meal_plan             TEXT DEFAULT 'RO',
  currency              TEXT DEFAULT 'ETB',
  discount_percent      NUMERIC(5,2) DEFAULT 0,
  tax_percent           NUMERIC(5,2) DEFAULT 0,
  service_charge_percent NUMERIC(5,2) DEFAULT 0,
  -- Contact info
  email                 TEXT DEFAULT '',
  phone                 TEXT DEFAULT '',
  identity_type         TEXT DEFAULT 'National ID',
  identity_no           TEXT DEFAULT '',
  -- Amend/internal fields
  special_requests      TEXT DEFAULT '',
  internal_notes        TEXT DEFAULT '',
  cancellation_reason   TEXT DEFAULT '',
  -- Audit fields
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_departure_after_arrival CHECK (departure > arrival),
  CONSTRAINT check_nights_positive CHECK (nights >= 1),
  CONSTRAINT check_adults_positive CHECK (adults >= 1)
);

-- ============================================================================
-- STEP 3: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reservations_reservation_no ON reservations(reservation_no);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_name     ON reservations(guest_name);
CREATE INDEX IF NOT EXISTS idx_reservations_status         ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_arrival        ON reservations(arrival);
CREATE INDEX IF NOT EXISTS idx_reservations_departure      ON reservations(departure);
CREATE INDEX IF NOT EXISTS idx_reservations_created_by     ON reservations(created_by);
CREATE INDEX IF NOT EXISTS idx_reservations_company        ON reservations(company_code) WHERE company_code != '';

-- ============================================================================
-- STEP 4: Auto-update updated_at trigger
-- ============================================================================

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS Policies
-- (Hotel staff with approved status can read all reservations.
--  hotel_manager + front_office can write. Students inherit their
--  training role from profiles.training_role.)
-- ============================================================================

-- Any authenticated + approved user can read reservations
DROP POLICY IF EXISTS "Approved users can view reservations" ON reservations;
CREATE POLICY "Approved users can view reservations"
  ON reservations FOR SELECT
  USING (get_my_status() = 'approved');

-- Approved users can create reservations
DROP POLICY IF EXISTS "Approved users can create reservations" ON reservations;
CREATE POLICY "Approved users can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (get_my_status() = 'approved');

-- Approved users can update reservations (amend / cancel / assign room)
DROP POLICY IF EXISTS "Approved users can update reservations" ON reservations;
CREATE POLICY "Approved users can update reservations"
  ON reservations FOR UPDATE
  USING (get_my_status() = 'approved');

-- ============================================================================
-- STEP 7: Sequence function to generate the next reservation number
-- ============================================================================

CREATE OR REPLACE FUNCTION next_reservation_no()
RETURNS TEXT AS $$
DECLARE
  max_no INTEGER;
  next_no TEXT;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(reservation_no FROM 4) AS INTEGER)), 0
  )
  INTO max_no
  FROM reservations
  WHERE reservation_no ~ '^RES[0-9]+$';

  next_no := 'RES' || LPAD(CAST(max_no + 1 AS TEXT), 3, '0');
  RETURN next_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE
-- Run: SELECT next_reservation_no(); -- should return RES001 on empty table
-- ============================================================================
