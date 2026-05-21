const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 PostgreSQL Connection Test\n');
console.log('This will help you find the correct password.\n');

rl.question('Enter your PostgreSQL password: ', async (password) => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Try connecting to default postgres database first
    user: 'postgres',
    password: password
  });

  try {
    console.log('\n⏳ Testing connection...');
    await client.connect();
    console.log('\n✅ SUCCESS! Password is correct!');
    console.log('\n📝 Update your .env file with:');
    console.log(`DB_PASSWORD=${password}`);
    
    // Try to create budmap database
    console.log('\n📦 Checking for budmap database...');
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'budmap'`);
    
    if (res.rows.length === 0) {
      console.log('⚠️  Database "budmap" does not exist.');
      console.log('Creating database...');
      await client.query('CREATE DATABASE budmap');
      console.log('✅ Database "budmap" created successfully!');
    } else {
      console.log('✅ Database "budmap" already exists!');
    }
    
    await client.end();
    console.log('\n🎉 All set! You can now run: npm run migrate\n');
    
  } catch (error) {
    console.log('\n❌ Connection failed!');
    if (error.code === '28P01') {
      console.log('Wrong password. Please try again.\n');
    } else {
      console.log('Error:', error.message, '\n');
    }
  }
  
  rl.close();
  process.exit();
});
