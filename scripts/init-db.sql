-- Keyloop Unified Document Viewer - Database Initialization Script
-- PostgreSQL Schema Setup

-- Create search_logs table for audit trail
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin VARCHAR(17) NOT NULL,
    vin_normalized VARCHAR(17) NOT NULL,
    total_documents INTEGER NOT NULL DEFAULT 0,
    sales_documents_found INTEGER DEFAULT 0,
    service_documents_found INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    sales_api_success BOOLEAN DEFAULT FALSE,
    service_api_success BOOLEAN DEFAULT FALSE,
    sales_api_response_time_ms INTEGER,
    service_api_response_time_ms INTEGER,
    sales_api_error_message TEXT,
    service_api_error_message TEXT,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_search_logs_vin ON search_logs(vin_normalized);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_log_id UUID NOT NULL REFERENCES search_logs(id) ON DELETE CASCADE,
    vin VARCHAR(17) NOT NULL,
    type VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    document_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for document queries
CREATE INDEX IF NOT EXISTS idx_documents_search_log_id ON documents(search_log_id);
CREATE INDEX IF NOT EXISTS idx_documents_vin ON documents(vin);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Create audit_events table for comprehensive logging
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    user_id VARCHAR(255),
    action VARCHAR(50),
    status VARCHAR(50),
    details JSONB DEFAULT '{}',
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);

-- Grant permissions (adjust as needed for your security model)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log initialization
INSERT INTO audit_events (event_type, action, status, details)
VALUES ('DATABASE', 'INITIALIZE', 'SUCCESS', '{"schema": "initialized", "timestamp": "' || CURRENT_TIMESTAMP || '"}');
