-- Drop existing enum type if it exists
DROP TYPE IF EXISTS taskstatus CASCADE;

-- Create new enum type with correct values
CREATE TYPE taskstatus AS ENUM ('pending', 'in-progress', 'completed', 'cancelled');
 
-- Update tasks table to use new enum type
ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE tasks ALTER COLUMN status TYPE taskstatus USING status::text::taskstatus;
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'pending'::taskstatus; 