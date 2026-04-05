const { pool } = require('./config');

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database!\n');
    
    // Get database info
    const dbInfo = await client.query(`
      SELECT current_database() as database,
             current_user as user,
             version() as version
    `);
    
    console.log('📊 Database Information:');
    console.log(`   Database: ${dbInfo.rows[0].database}`);
    console.log(`   User: ${dbInfo.rows[0].user}`);
    console.log(`   Version: ${dbInfo.rows[0].version.split(',')[0]}\n`);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('📋 Existing Tables:');
      tables.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log();
      
      // Get row counts
      console.log('📈 Data Summary:');
      const counts = await Promise.all([
        client.query('SELECT COUNT(*) FROM organizations'),
        client.query('SELECT COUNT(*) FROM departments'),
        client.query('SELECT COUNT(*) FROM users'),
        client.query('SELECT COUNT(*) FROM budget_categories'),
        client.query('SELECT COUNT(*) FROM budgets'),
        client.query('SELECT COUNT(*) FROM transactions'),
        client.query('SELECT COUNT(*) FROM notifications')
      ]);
      
      console.log(`   Organizations: ${counts[0].rows[0].count}`);
      console.log(`   Departments: ${counts[1].rows[0].count}`);
      console.log(`   Users: ${counts[2].rows[0].count}`);
      console.log(`   Budget Categories: ${counts[3].rows[0].count}`);
      console.log(`   Budgets: ${counts[4].rows[0].count}`);
      console.log(`   Transactions: ${counts[5].rows[0].count}`);
      console.log(`   Notifications: ${counts[6].rows[0].count}`);
      console.log();
    } else {
      console.log('⚠️  No tables found. Run migration first:\n');
      console.log('   npm run migrate\n');
    }
    
    client.release();
    console.log('✨ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   PostgreSQL server is not running or not accessible.');
      console.error('   Please check:');
      console.error('   1. PostgreSQL service is running');
      console.error('   2. Host and port in .env are correct');
      console.error('   3. Firewall is not blocking the connection\n');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed.');
      console.error('   Please check:');
      console.error('   1. Username and password in .env are correct');
      console.error('   2. User has access to the database\n');
    } else if (error.code === '3D000') {
      console.error('   Database does not exist.');
      console.error('   Please create the database first:');
      console.error('   psql -U postgres -c "CREATE DATABASE budmap;"\n');
    } else {
      console.error('   Error details:', error.message);
      console.error('   Error code:', error.code, '\n');
    }
    
    throw error;
  } finally {
    await pool.end();
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
