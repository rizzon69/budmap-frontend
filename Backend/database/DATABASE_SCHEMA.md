```mermaid
erDiagram
    ORGANIZATIONS ||--o{ DEPARTMENTS : has
    ORGANIZATIONS ||--o{ USERS : employs
    ORGANIZATIONS ||--o{ BUDGETS : manages
    ORGANIZATIONS ||--o{ TRANSACTIONS : records
    
    DEPARTMENTS ||--o{ USERS : contains
    DEPARTMENTS ||--o{ BUDGETS : allocates
    DEPARTMENTS ||--o{ TRANSACTIONS : makes
    DEPARTMENTS }o--|| USERS : "headed by"
    
    USERS ||--o{ BUDGETS : creates
    USERS ||--o{ BUDGETS : approves
    USERS ||--o{ TRANSACTIONS : creates
    USERS ||--o{ TRANSACTIONS : approves
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ACTIVITY_LOGS : generates
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ MESSAGES : receives
    USERS ||--o{ PASSWORD_RESETS : requests
    USERS ||--o{ EMAIL_VERIFICATIONS : needs
    
    BUDGETS ||--o{ BUDGET_ALLOCATIONS : contains
    BUDGETS ||--o{ TRANSACTIONS : tracks
    
    BUDGET_CATEGORIES ||--o{ BUDGET_ALLOCATIONS : categorizes
    BUDGET_CATEGORIES ||--o{ TRANSACTIONS : classifies
    
    MESSAGES }o--o| MESSAGES : replies_to
    
    ORGANIZATIONS {
        varchar id PK
        varchar name
        varchar type
        varchar email UK
        varchar phone
        text address
        varchar website
        varchar fiscal_year_start
        varchar currency
        text logo
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    DEPARTMENTS {
        varchar id PK
        varchar name
        varchar code
        varchar organization_id FK
        varchar head_id FK
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        varchar id PK
        varchar email UK
        varchar password
        varchar first_name
        varchar last_name
        varchar role
        varchar organization_id FK
        varchar department_id FK
        varchar phone
        text avatar
        boolean is_active
        boolean is_email_verified
        timestamp created_at
        timestamp updated_at
        timestamp last_login
    }
    
    BUDGET_CATEGORIES {
        varchar id PK
        varchar name
        varchar type
        varchar icon
        varchar color
        timestamp created_at
    }
    
    BUDGETS {
        varchar id PK
        varchar name
        varchar organization_id FK
        varchar department_id FK
        varchar fiscal_year
        date start_date
        date end_date
        decimal total_amount
        decimal allocated_amount
        decimal spent_amount
        varchar status
        text description
        varchar created_by FK
        varchar approved_by FK
        timestamp approved_at
        timestamp created_at
        timestamp updated_at
    }
    
    BUDGET_ALLOCATIONS {
        varchar id PK
        varchar budget_id FK
        varchar category_id FK
        decimal allocated_amount
        decimal spent_amount
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    TRANSACTIONS {
        varchar id PK
        varchar organization_id FK
        varchar budget_id FK
        varchar category_id FK
        varchar department_id FK
        varchar type
        decimal amount
        text description
        date date
        varchar payee
        varchar reference
        varchar status
        varchar created_by FK
        varchar approved_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    NOTIFICATIONS {
        varchar id PK
        varchar user_id FK
        varchar title
        text message
        varchar type
        boolean is_read
        varchar link
        timestamp created_at
    }
    
    ACTIVITY_LOGS {
        varchar id PK
        varchar user_id FK
        varchar action
        varchar entity
        varchar entity_id
        text details
        varchar ip_address
        timestamp created_at
    }
    
    MESSAGES {
        varchar id PK
        varchar sender_id FK
        varchar receiver_id FK
        varchar subject
        text body
        boolean is_read
        varchar parent_message_id FK
        timestamp created_at
        timestamp read_at
    }
    
    PASSWORD_RESETS {
        varchar id PK
        varchar user_id FK
        varchar token UK
        timestamp expires_at
        boolean used
        timestamp created_at
    }
    
    EMAIL_VERIFICATIONS {
        varchar id PK
        varchar user_id FK
        varchar token UK
        timestamp expires_at
        boolean verified
        timestamp created_at
    }
```

# BudMap Database Schema

## Overview
This diagram shows the complete database structure for BudMap with all 12 tables and their relationships.

## Key Relationships

### Organization Hierarchy
- **Organizations** → **Departments** → **Users**
- Each organization can have multiple departments
- Each department belongs to one organization
- Users are assigned to both organizations and departments

### Budget Flow
- **Budgets** are created at organization or department level
- **Budget Allocations** distribute budget across categories
- **Transactions** record actual spending against budgets
- All spending is tracked and categorized

### User Management
- Users have roles (admin, finance_officer, department_head, viewer)
- Department heads are linked back to departments
- Users create and approve budgets and transactions
- Activity is logged in activity_logs

### Communication & Notifications
- **Notifications** alert users about important events
- **Messages** enable internal communication
- Messages can be threaded (reply to messages)

### Security & Recovery
- **Password Resets** handle password recovery tokens
- **Email Verifications** manage email confirmation
- Both use token-based systems with expiration

## Table Details

### Core Tables (6)
1. **organizations** - Base entity for all operations
2. **departments** - Organizational structure
3. **users** - User accounts and authentication
4. **budget_categories** - Classification system
5. **budgets** - Budget planning and tracking
6. **transactions** - Financial transactions

### Support Tables (6)
7. **budget_allocations** - Budget distribution
8. **notifications** - User alerts
9. **activity_logs** - Audit trail
10. **messages** - Internal messaging
11. **password_resets** - Password recovery
12. **email_verifications** - Email confirmation

## Features

### Data Integrity
- Foreign key constraints ensure referential integrity
- Cascade deletes where appropriate
- Set NULL for optional references

### Performance
- Indexes on all foreign keys
- Indexes on frequently queried fields
- Connection pooling for efficiency

### Audit Trail
- created_at and updated_at on all main tables
- Automatic timestamp updates via triggers
- Complete activity logging

### Flexibility
- Department-level or organization-level budgets
- Multiple budget periods (fiscal years)
- Hierarchical message threading
- Multi-category budget allocations
