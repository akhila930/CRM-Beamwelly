-- Drop existing table if it exists
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Create lead status enum type
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');

-- Create leads table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    company VARCHAR,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    source VARCHAR,
    status lead_status NOT NULL DEFAULT 'new',
    notes TEXT,
    expected_value FLOAT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 