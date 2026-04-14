-- Add employee_id column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE; 