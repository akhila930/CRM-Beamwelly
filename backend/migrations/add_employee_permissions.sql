-- Add new permission fields to employees table
ALTER TABLE employees
ADD COLUMN can_assign_tasks BOOLEAN DEFAULT FALSE,
ADD COLUMN can_access_recruitment BOOLEAN DEFAULT FALSE; 