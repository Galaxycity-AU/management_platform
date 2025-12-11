-- ========================================
-- Management Platform Database Schema
-- Created: 2025-12-11
-- ========================================

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS workers;

-- ========================================
-- PROJECTS TABLE
-- ========================================
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATE NULL,
    status VARCHAR(50) NOT NULL,
    client VARCHAR(255) NULL,
    manager VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- WORKERS TABLE
-- ========================================
CREATE TABLE workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- JOBS TABLE
-- ========================================
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    worker_id INT NULL,
    status VARCHAR(50) NOT NULL,
    scheduled_start DATETIME NULL,
    scheduled_end DATETIME NULL,
    actual_start DATETIME NULL,
    actual_end DATETIME NULL,
    approval_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- APPROVALS TABLE
-- ========================================
CREATE TABLE approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    approver_id INT NULL,
    comments TEXT NULL,
    modified_start DATETIME NULL,
    modified_end DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES workers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- ADD FOREIGN KEY FOR APPROVAL_ID IN JOBS
-- ========================================
-- Note: We add this after creating the approvals table to avoid circular dependency issues
ALTER TABLE jobs ADD FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE SET NULL;

-- ========================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ========================================
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_worker_id ON jobs(worker_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_approval_id ON jobs(approval_id);
CREATE INDEX idx_approvals_job_id ON approvals(job_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_workers_email ON workers(email);

-- ========================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- ========================================

-- Sample Workers
INSERT INTO workers (name, position, email, phone) VALUES 
('John Smith', 'Project Manager', 'john.smith@company.com', '555-0101'),
('Sarah Johnson', 'Senior Developer', 'sarah.johnson@company.com', '555-0102'),
('Mike Davis', 'Electrician', 'mike.davis@company.com', '555-0103'),
('Emily Brown', 'Supervisor', 'emily.brown@company.com', '555-0104');

-- Sample Projects
INSERT INTO projects (name, description, deadline, status, client, manager) VALUES 
('Office Renovation', 'Complete renovation of 5th floor office space', '2025-03-15', 'active', 'Tech Corp Inc', 'John Smith'),
('Warehouse Construction', 'New warehouse facility construction', '2025-06-30', 'planning', 'Logistics Ltd', 'Emily Brown'),
('Retail Store Fit-out', 'Interior fit-out for new retail location', '2025-02-28', 'active', 'Fashion Retail Co', 'John Smith');

-- Sample Jobs
INSERT INTO jobs (project_id, worker_id, status, scheduled_start, scheduled_end) VALUES 
(1, 2, 'scheduled', '2025-12-15 08:00:00', '2025-12-15 17:00:00'),
(1, 3, 'active', '2025-12-11 09:00:00', '2025-12-11 18:00:00'),
(2, 3, 'waiting_approval', '2025-12-20 08:00:00', '2025-12-20 16:00:00');

-- Sample Approvals (for the waiting_approval job)
INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end) VALUES 
(3, NULL, NULL, NULL, NULL);

-- Update job 3 to reference the approval
UPDATE jobs SET approval_id = 1 WHERE id = 3;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Uncomment these to verify the setup

-- SELECT 'Projects' as Table_Name, COUNT(*) as Row_Count FROM projects
-- UNION ALL
-- SELECT 'Workers', COUNT(*) FROM workers
-- UNION ALL
-- SELECT 'Jobs', COUNT(*) FROM jobs
-- UNION ALL
-- SELECT 'Approvals', COUNT(*) FROM approvals;

-- ========================================
-- NOTES:
-- ========================================
-- 1. All tables use InnoDB engine for transaction support and foreign keys
-- 2. Character set is utf8mb4 for full Unicode support (including emojis)
-- 3. Timestamps are automatically managed for created_at and updated_at
-- 4. Foreign keys use ON DELETE CASCADE or SET NULL appropriately
-- 5. Approver_id in approvals can be NULL (for jobs awaiting approval)
-- 6. Worker_id in jobs can be NULL (for unassigned jobs)
-- 7. Approval_id in jobs can be NULL (for jobs not requiring approval)
