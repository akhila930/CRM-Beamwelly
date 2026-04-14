-- First, let's remove the tasks, documents, attendance, and milestones fields if they exist
ALTER TABLE employees 
DROP COLUMN IF EXISTS tasks,
DROP COLUMN IF EXISTS documents,
DROP COLUMN IF EXISTS attendance,
DROP COLUMN IF EXISTS milestones;

-- Then add them back as JSON columns with default empty arrays
ALTER TABLE employees 
ADD COLUMN tasks JSON DEFAULT '[]',
ADD COLUMN documents JSON DEFAULT '[]',
ADD COLUMN attendance JSON DEFAULT '[]',
ADD COLUMN milestones JSON DEFAULT '[]';

DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
