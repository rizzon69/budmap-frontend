const { Client } = require('pg');

console.log('\n🔍 Testing PostgreSQL Connection...\n');

// List of common passwords to try
const commonPasswords = [
  'postgres',
  'admin', 
  'password',
  'root',
  '123456',
  'Admin123',
  'Postgres123',
  ''  // empty password
];

async function testPassword(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function findPassword() {
  console.log('Testing common passwords...\n');
  
  for (let i = 0; i < commonPasswords.length; i++) {
    const password = commonPasswords[i];
    const displayPassword = password === '' ? '(empty/blank)' : password;
    
    process.stdout.write(`[${i + 1}/${commonPasswords.length}] Testing: ${displayPassword}... `);
    
    const works = await testPassword(password);
    
    if (works) {
      console.log('✅ SUCCESS!\n');
      console.log('========================================');
      console.log('Your PostgreSQL password is:', displayPassword);
      console.log('========================================\n');
      console.log('Next steps:');
      console.log('1. Update your .env file:');
      console.log(`   DB_PASSWORD=${password}`);
      console.log('\n2. Run database creation:');
      console.log('   Double-click: create-budmap-database.bat');
      console.log('\n3. Run migration:');
      console.log('   cd Backend');
      console.log('   npm run migrate');
      console.log('\n========================================\n');
      return true;
    } else {
      console.log('❌');
    }
  }
  
  console.log('\n========================================');
  console.log('None of the common passwords worked!');
  console.log('========================================\n');
  console.log('Options:');
  console.log('1. Try to remember your PostgreSQL password');
  console.log('2. Reset your password (see RESET_POSTGRES_PASSWORD.md)');
  console.log('3. Reinstall PostgreSQL\n');
  
  return false;
}

findPassword()
  .then((found) => {
    if (!found) {
      console.log('Need help? Check these files:');
      console.log('- RESET_POSTGRES_PASSWORD.md');
      console.log('- DATABASE_CREATION_GUIDE.md\n');
    }
    process.exit(found ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure PostgreSQL is installed and running!\n');
    process.exit(1);
  });
