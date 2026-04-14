-- Add user_id column to employees table
ALTER TABLE employees ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Update existing employees to link with users
UPDATE employees e
SET user_id = u.id
FROM users u
WHERE e.email = u.email;

-- Make user_id NOT NULL after data migration
ALTER TABLE employees ALTER COLUMN user_id SET NOT NULL; 