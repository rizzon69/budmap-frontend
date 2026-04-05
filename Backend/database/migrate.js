const fs = require('fs');
const path = require('path');
const { pool } = require('./config');
const store = require('../data/store');
const bcrypt = require('bcryptjs');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...\n');
    
    // Read and execute schema
    console.log('📋 Creating database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Migrate Organizations
    console.log('📦 Migrating organizations...');
    for (const org of store.organizations) {
      await client.query(`
        INSERT INTO organizations (id, name, type, email, phone, address, website, fiscal_year_start, currency, logo, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        org.id, org.name, org.type, org.email, org.phone, org.address,
        org.website, org.fiscalYearStart, org.currency, org.logo,
        org.isActive, org.createdAt, org.updatedAt
      ]);
    }
    console.log(`✅ Migrated ${store.organizations.length} organizations\n`);
    
    // Migrate Departments (without head_id first)
    console.log('🏢 Migrating departments...');
    for (const dept of store.departments) {
      await client.query(`
        INSERT INTO departments (id, name, code, organization_id, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        dept.id, dept.name, dept.code, dept.organizationId,
        dept.description, dept.isActive, dept.createdAt, dept.updatedAt
      ]);
    }
    console.log(`✅ Migrated ${store.departments.length} departments\n`);
    
    // Migrate Users
    console.log('👥 Migrating users...');
    for (const user of store.users) {
      await client.query(`
        INSERT INTO users (id, email, password, first_name, last_name, role, organization_id, department_id, phone, avatar, is_active, is_email_verified, created_at, updated_at, last_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        user.id, user.email, user.password, user.firstName, user.lastName,
        user.role, user.organizationId, user.departmentId, user.phone,
        user.avatar, user.isActive, user.isEmailVerified, user.createdAt,
        user.updatedAt, user.lastLogin
      ]);
    }
    console.log(`✅ Migrated ${store.users.length} users\n`);
    
    // Update department heads
    console.log('🔗 Updating department heads...');
    for (const dept of store.departments) {
      if (dept.headId) {
        await client.query(`
          UPDATE departments SET head_id = $1 WHERE id = $2
        `, [dept.headId, dept.id]);
      }
    }
    console.log('✅ Department heads updated\n');
    
    // Migrate Budget Categories
    console.log('📊 Migrating budget categories...');
    for (const category of store.budgetCategories) {
      await client.query(`
        INSERT INTO budget_categories (id, name, type, icon, color)
        VALUES ($1, $2, $3, $4, $5)
      `, [category.id, category.name, category.type, category.icon, category.color]);
    }
    console.log(`✅ Migrated ${store.budgetCategories.length} budget categories\n`);
    
    // Migrate Budgets
    console.log('💰 Migrating budgets...');
    for (const budget of store.budgets) {
      await client.query(`
        INSERT INTO budgets (id, name, organization_id, department_id, fiscal_year, start_date, end_date, total_amount, allocated_amount, spent_amount, status, description, created_by, approved_by, approved_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        budget.id, budget.name, budget.organizationId, budget.departmentId,
        budget.fiscalYear, budget.startDate, budget.endDate, budget.totalAmount,
        budget.allocatedAmount, budget.spentAmount, budget.status, budget.description,
        budget.createdBy, budget.approvedBy, budget.approvedAt, budget.createdAt,
        budget.updatedAt
      ]);
    }
    console.log(`✅ Migrated ${store.budgets.length} budgets\n`);
    
    // Migrate Budget Allocations
    console.log('📈 Migrating budget allocations...');
    for (const allocation of store.budgetAllocations) {
      await client.query(`
        INSERT INTO budget_allocations (id, budget_id, category_id, allocated_amount, spent_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        allocation.id, allocation.budgetId, allocation.categoryId,
        allocation.allocatedAmount, allocation.spentAmount, allocation.notes
      ]);
    }
    console.log(`✅ Migrated ${store.budgetAllocations.length} budget allocations\n`);
    
    // Migrate Transactions
    console.log('💳 Migrating transactions...');
    for (const transaction of store.transactions) {
      await client.query(`
        INSERT INTO transactions (id, organization_id, budget_id, category_id, department_id, type, amount, description, date, payee, reference, status, created_by, approved_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        transaction.id, transaction.organizationId, transaction.budgetId,
        transaction.categoryId, transaction.departmentId, transaction.type,
        transaction.amount, transaction.description, transaction.date,
        transaction.payee, transaction.reference, transaction.status,
        transaction.createdBy, transaction.approvedBy, transaction.createdAt,
        transaction.updatedAt
      ]);
    }
    console.log(`✅ Migrated ${store.transactions.length} transactions\n`);
    
    // Migrate Notifications
    console.log('🔔 Migrating notifications...');
    for (const notification of store.notifications) {
      await client.query(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        notification.id, notification.userId, notification.title,
        notification.message, notification.type, notification.isRead,
        notification.link, notification.createdAt
      ]);
    }
    console.log(`✅ Migrated ${store.notifications.length} notifications\n`);
    
    // Migrate Activity Logs
    console.log('📝 Migrating activity logs...');
    for (const log of store.activityLogs) {
      await client.query(`
        INSERT INTO activity_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        log.id, log.userId, log.action, log.entity, log.entityId,
        log.details, log.ipAddress, log.createdAt
      ]);
    }
    console.log(`✅ Migrated ${store.activityLogs.length} activity logs\n`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✨ Migration completed successfully!\n');
    console.log('📊 Migration Summary:');
    console.log(`   Organizations: ${store.organizations.length}`);
    console.log(`   Departments: ${store.departments.length}`);
    console.log(`   Users: ${store.users.length}`);
    console.log(`   Budget Categories: ${store.budgetCategories.length}`);
    console.log(`   Budgets: ${store.budgets.length}`);
    console.log(`   Budget Allocations: ${store.budgetAllocations.length}`);
    console.log(`   Transactions: ${store.transactions.length}`);
    console.log(`   Notifications: ${store.notifications.length}`);
    console.log(`   Activity Logs: ${store.activityLogs.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n🎉 All done! Your database is ready to use.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
