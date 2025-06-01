/*
  # Reservation Management System Schema

  1. New Tables
    - `reservations`
      - Primary table for storing reservation details
      - Includes customer info, dates, status
    - `reservation_statuses`
      - Lookup table for possible reservation statuses
    - `reservation_history`
      - Audit log for tracking reservation changes
    - `admin_notes`
      - Notes/comments added by administrators

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated admin access
*/

-- Create enum for reservation status
CREATE TYPE reservation_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  reservation_date timestamptz NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create reservation history table for audit trail
CREATE TABLE IF NOT EXISTS reservation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id),
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  old_status reservation_status,
  new_status reservation_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create admin notes table
CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin read access" ON reservations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access" ON reservations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin read history" ON reservation_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write history" ON reservation_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin read notes" ON admin_notes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write notes" ON admin_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create function to update reservation status
CREATE OR REPLACE FUNCTION update_reservation_status(
  reservation_id uuid,
  new_status reservation_status,
  admin_id uuid
) RETURNS void AS $$
BEGIN
  -- Insert into history first
  INSERT INTO reservation_history (
    reservation_id,
    changed_by,
    old_status,
    new_status
  )
  SELECT
    reservation_id,
    admin_id,
    status,
    new_status
  FROM reservations
  WHERE id = reservation_id;

  -- Update the reservation
  UPDATE reservations
  SET
    status = new_status,
    updated_at = now()
  WHERE id = reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create realtime publication
CREATE PUBLICATION supabase_realtime FOR TABLE reservations, reservation_history, admin_notes;