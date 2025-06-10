-- Initialize database with some sample data for development

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at) 
VALUES (
    'admin@devopsjobs.com', 
    'scrypt:32768:8:1$2b2KQqOQNGHdNJjl$5f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e',
    'Admin', 
    'User', 
    'admin', 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE id=id;

-- Create sample employer
INSERT INTO users (email, password_hash, first_name, last_name, role, company, created_at, updated_at) 
VALUES (
    'employer@techcorp.com', 
    'scrypt:32768:8:1$2b2KQqOQNGHdNJjl$5f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e',
    'Jane', 
    'Smith', 
    'employer', 
    'TechCorp Inc.',
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE id=id;

-- Create sample job seeker
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at) 
VALUES (
    'user@example.com', 
    'scrypt:32768:8:1$2b2KQqOQNGHdNJjl$5f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e8f8b8c8e',
    'John', 
    'Doe', 
    'user', 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE id=id;