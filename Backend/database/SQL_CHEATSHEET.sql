-- BudMap Database - Common SQL Queries Cheat Sheet

-- ==========================================
-- DATABASE MANAGEMENT
-- ==========================================

-- Connect to database
\c budmap

-- List all databases
\l

-- List all tables
\dt

-- Describe a table structure
\d users

-- Show table with data types
\d+ users

-- ==========================================
-- USERS & AUTHENTICATION
-- ==========================================

-- Get all users
SELECT id, email, first_name, last_name, role, is_active 
FROM users;

-- Find user by email
SELECT * FROM users WHERE email = 'admin@budmap.com';

-- Get users by role
SELECT email, first_name, last_name, role 
FROM users 
WHERE role = 'admin';

-- Get active users count
SELECT role, COUNT(*) as count 
FROM users 
WHERE is_active = true 
GROUP BY role;

-- Update user information
UPDATE users 
SET first_name = 'NewName', updated_at = CURRENT_TIMESTAMP 
WHERE email = 'admin@budmap.com';

-- Deactivate a user
UPDATE users 
SET is_active = false, updated_at = CURRENT_TIMESTAMP 
WHERE email = 'user@example.com';

-- ==========================================
-- ORGANIZATIONS & DEPARTMENTS
-- ==========================================

-- Get all organizations
SELECT id, name, type, email, is_active 
FROM organizations;

-- Get departments with their organization
SELECT 
    d.name as department_name,
    d.code,
    o.name as organization_name
FROM departments d
JOIN organizations o ON d.organization_id = o.id;

-- Get department with head information
SELECT 
    d.name as department,
    d.code,
    u.first_name || ' ' || u.last_name as department_head
FROM departments d
LEFT JOIN users u ON d.head_id = u.id;

-- Count departments per organization
SELECT 
    o.name as organization,
    COUNT(d.id) as department_count
FROM organizations o
LEFT JOIN departments d ON o.id = d.organization_id
GROUP BY o.name;

-- ==========================================
-- BUDGETS
-- ==========================================

-- Get all active budgets
SELECT 
    b.name,
    b.fiscal_year,
    b.total_amount,
    b.spent_amount,
    ROUND((b.spent_amount / b.total_amount * 100)::numeric, 2) as utilization_percent,
    b.status
FROM budgets b
WHERE b.status = 'active'
ORDER BY b.created_at DESC;

-- Get budget with organization and department
SELECT 
    b.name as budget_name,
    o.name as organization,
    d.name as department,
    b.total_amount,
    b.spent_amount,
    b.status
FROM budgets b
JOIN organizations o ON b.organization_id = o.id
LEFT JOIN departments d ON b.department_id = d.id;

-- Budget utilization summary
SELECT 
    fiscal_year,
    COUNT(*) as total_budgets,
    SUM(total_amount) as total_budget,
    SUM(spent_amount) as total_spent,
    ROUND(AVG(spent_amount / total_amount * 100)::numeric, 2) as avg_utilization
FROM budgets
GROUP BY fiscal_year
ORDER BY fiscal_year DESC;

-- Get budget allocations by category
SELECT 
    b.name as budget,
    bc.name as category,
    bc.type,
    ba.allocated_amount,
    ba.spent_amount,
    ROUND((ba.spent_amount / ba.allocated_amount * 100)::numeric, 2) as utilization_percent
FROM budget_allocations ba
JOIN budgets b ON ba.budget_id = b.id
JOIN budget_categories bc ON ba.category_id = bc.id
ORDER BY b.name, bc.name;

-- ==========================================
-- TRANSACTIONS
-- ==========================================

-- Get recent transactions
SELECT 
    t.date,
    t.description,
    t.amount,
    t.type,
    bc.name as category,
    t.status,
    u.first_name || ' ' || u.last_name as created_by
FROM transactions t
JOIN budget_categories bc ON t.category_id = bc.id
JOIN users u ON t.created_by = u.id
ORDER BY t.date DESC
LIMIT 10;

-- Transaction summary by type
SELECT 
    type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM transactions
WHERE status = 'completed'
GROUP BY type;

-- Monthly transaction summary
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    type,
    COUNT(*) as count,
    SUM(amount) as total
FROM transactions
WHERE status = 'completed'
GROUP BY TO_CHAR(date, 'YYYY-MM'), type
ORDER BY month DESC, type;

-- Pending transactions requiring approval
SELECT 
    t.id,
    t.date,
    t.description,
    t.amount,
    t.type,
    u.first_name || ' ' || u.last_name as created_by
FROM transactions t
JOIN users u ON t.created_by = u.id
WHERE t.status = 'pending'
ORDER BY t.date DESC;

-- Top expense categories
SELECT 
    bc.name as category,
    COUNT(t.id) as transaction_count,
    SUM(t.amount) as total_amount
FROM transactions t
JOIN budget_categories bc ON t.category_id = bc.id
WHERE t.type = 'expense' AND t.status = 'completed'
GROUP BY bc.name
ORDER BY total_amount DESC
LIMIT 5;

-- ==========================================
-- REPORTS & ANALYTICS
-- ==========================================

-- Budget vs Actual spending report
SELECT 
    b.name as budget,
    b.fiscal_year,
    b.total_amount as budgeted,
    b.spent_amount as actual,
    b.total_amount - b.spent_amount as remaining,
    ROUND((b.spent_amount / b.total_amount * 100)::numeric, 2) as utilization_percent
FROM budgets b
WHERE b.status = 'active'
ORDER BY utilization_percent DESC;

-- Department-wise spending
SELECT 
    d.name as department,
    SUM(t.amount) as total_spent,
    COUNT(t.id) as transaction_count
FROM transactions t
JOIN departments d ON t.department_id = d.id
WHERE t.type = 'expense' AND t.status = 'completed'
GROUP BY d.name
ORDER BY total_spent DESC;

-- Year over year comparison
SELECT 
    b.fiscal_year,
    SUM(b.total_amount) as total_budget,
    SUM(b.spent_amount) as total_spent,
    ROUND(AVG(b.spent_amount / b.total_amount * 100)::numeric, 2) as avg_utilization
FROM budgets b
GROUP BY b.fiscal_year
ORDER BY b.fiscal_year;

-- ==========================================
-- ACTIVITY LOGS & AUDIT
-- ==========================================

-- Recent activity logs
SELECT 
    al.created_at,
    u.email as user,
    al.action,
    al.entity,
    al.details
FROM activity_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;

-- Activity summary by user
SELECT 
    u.email,
    u.role,
    COUNT(al.id) as total_actions
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
GROUP BY u.email, u.role
ORDER BY total_actions DESC;

-- Activity by action type
SELECT 
    action,
    COUNT(*) as count
FROM activity_logs
GROUP BY action
ORDER BY count DESC;

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

-- Unread notifications per user
SELECT 
    u.email,
    COUNT(n.id) as unread_count
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id AND n.is_read = false
GROUP BY u.email
HAVING COUNT(n.id) > 0
ORDER BY unread_count DESC;

-- Recent notifications
SELECT 
    u.email as user,
    n.title,
    n.type,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 10;

-- ==========================================
-- DATA MAINTENANCE
-- ==========================================

-- Count records in all tables
SELECT 
    'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'budget_categories', COUNT(*) FROM budget_categories
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL
SELECT 'budget_allocations', COUNT(*) FROM budget_allocations
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs;

-- Clear old notifications (older than 30 days)
DELETE FROM notifications 
WHERE created_at < CURRENT_DATE - INTERVAL '30 days' 
AND is_read = true;

-- Archive old activity logs
-- First create archive table, then move data
-- CREATE TABLE activity_logs_archive (LIKE activity_logs INCLUDING ALL);
-- INSERT INTO activity_logs_archive SELECT * FROM activity_logs WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
-- DELETE FROM activity_logs WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

-- ==========================================
-- BACKUP & RESTORE
-- ==========================================

-- Backup entire database (run from command line)
-- pg_dump -U postgres budmap > backup_$(date +%Y%m%d).sql

-- Backup specific table
-- pg_dump -U postgres -t users budmap > users_backup.sql

-- Restore database
-- psql -U postgres budmap < backup_20240115.sql

-- ==========================================
-- PERFORMANCE & MONITORING
-- ==========================================

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size('budmap')) as database_size;

-- Active connections
SELECT 
    count(*) as connections,
    usename,
    application_name
FROM pg_stat_activity
WHERE datname = 'budmap'
GROUP BY usename, application_name;

-- ==========================================
-- USEFUL TIPS
-- ==========================================

-- Export query results to CSV (in psql)
-- \copy (SELECT * FROM users) TO 'users.csv' CSV HEADER

-- Import CSV data
-- \copy users FROM 'users.csv' CSV HEADER

-- Show current user and database
-- SELECT current_user, current_database();

-- Show server version
-- SELECT version();

-- Show current timestamp
-- SELECT CURRENT_TIMESTAMP;

-- Explain query plan
-- EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'admin@budmap.com';
