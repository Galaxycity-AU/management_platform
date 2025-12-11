-- Create the database if it does not exist
CREATE DATABASE IF NOT EXISTS pm_local_mock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pm_local_mock;

-- ========================================
-- PROJECTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS projects (
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
CREATE TABLE IF NOT EXISTS workers (
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
CREATE TABLE IF NOT EXISTS jobs (
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
CREATE TABLE IF NOT EXISTS approvals (
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
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_approval_id FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE SET NULL;
