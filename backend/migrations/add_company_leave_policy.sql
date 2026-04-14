-- Create company_leave_policies table
CREATE TABLE IF NOT EXISTS company_leave_policies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    annual_leave_count INTEGER NOT NULL DEFAULT 20,
    sick_leave_count INTEGER NOT NULL DEFAULT 15,
    casual_leave_count INTEGER NOT NULL DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add company_id to leave_requests table if not exists
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- Add company_id to leave_balances table if not exists
ALTER TABLE leave_balances 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_leave_policies_updated_at
    BEFORE UPDATE ON company_leave_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE company_leave_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage their company's leave policies"
    ON company_leave_policies
    FOR ALL
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_companies 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Company users can view their company's leave policies"
    ON company_leave_policies
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_companies 
            WHERE user_id = auth.uid()
        )
    ); 