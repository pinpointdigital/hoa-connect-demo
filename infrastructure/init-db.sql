-- HOA Connect Production Database Schema
-- Multi-tenant architecture for Seabreeze Management (8 communities)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Communities table (8 communities for Seabreeze)
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (HOA Management, Board Members, Homeowners)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'management', 'board', 'homeowner')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table (homeowner properties)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    address VARCHAR(255) NOT NULL,
    lot_number VARCHAR(50),
    property_type VARCHAR(50) DEFAULT 'single_family',
    square_footage INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    year_built INTEGER,
    hoa_fee_monthly DECIMAL(10,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table (ARC requests, maintenance, etc.)
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    homeowner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    data JSONB DEFAULT '{}',
    timeline JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forms table (digital forms and documents)
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    form_type VARCHAR(50) NOT NULL,
    template JSONB NOT NULL,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form submissions table
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    digital_signature JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (email/SMS tracking)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    template VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    provider_id VARCHAR(255),
    provider_response JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (file storage references)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CC&R sections table (community rules and regulations)
CREATE TABLE ccr_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    section_number VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    ai_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voting sessions table (board voting)
CREATE TABLE voting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    voting_type VARCHAR(50) DEFAULT 'majority',
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table (individual board member votes)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voting_session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote VARCHAR(20) NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
    comments TEXT,
    digital_signature JSONB,
    cast_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voting_session_id, voter_id)
);

-- Audit log table (for compliance and tracking)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_community_id ON users(community_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_community_id ON properties(community_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_requests_community_id ON requests(community_id);
CREATE INDEX idx_requests_homeowner_id ON requests(homeowner_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX idx_votes_voting_session_id ON votes(voting_session_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_audit_logs_community_id ON audit_logs(community_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ccr_sections_updated_at BEFORE UPDATE ON ccr_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voting_sessions_updated_at BEFORE UPDATE ON voting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample Seabreeze communities
INSERT INTO communities (name, address, phone, email, settings) VALUES
('Rancho Madrina', '123 Community Drive, Rancho Madrina, CA 92688', '(949) 555-0101', 'management@ranchomadrina.com', '{"homeowner_count": 250, "monthly_fee": 200}'),
('Seabreeze Estates', '456 Ocean View Blvd, Newport Beach, CA 92660', '(949) 555-0102', 'management@seabreezeestates.com', '{"homeowner_count": 300, "monthly_fee": 250}'),
('Pacific Heights', '789 Hillside Ave, Laguna Beach, CA 92651', '(949) 555-0103', 'management@pacificheights.com', '{"homeowner_count": 200, "monthly_fee": 180}'),
('Marina Village', '321 Harbor Way, Dana Point, CA 92629', '(949) 555-0104', 'management@marinavillage.com', '{"homeowner_count": 275, "monthly_fee": 220}'),
('Sunset Ridge', '654 Ridge Road, San Clemente, CA 92672', '(949) 555-0105', 'management@sunsetridge.com', '{"homeowner_count": 225, "monthly_fee": 190}'),
('Coastal Breeze', '987 Coastal Hwy, Huntington Beach, CA 92648', '(949) 555-0106', 'management@coastalbreeze.com', '{"homeowner_count": 350, "monthly_fee": 280}'),
('Garden Grove HOA', '147 Garden Lane, Garden Grove, CA 92840', '(949) 555-0107', 'management@gardengrove.com', '{"homeowner_count": 180, "monthly_fee": 160}'),
('Vista Del Mar', '258 Vista Drive, Irvine, CA 92602', '(949) 555-0108', 'management@vistadelmar.com', '{"homeowner_count": 320, "monthly_fee": 240}');

-- Create admin user for Seabreeze Management
INSERT INTO users (community_id, email, phone, first_name, last_name, role, profile) 
SELECT 
    (SELECT id FROM communities WHERE name = 'Rancho Madrina' LIMIT 1),
    'admin@seabreezemanagement.com',
    '(949) 555-0100',
    'Admin',
    'User',
    'admin',
    '{"company": "Seabreeze Management", "title": "System Administrator"}';



