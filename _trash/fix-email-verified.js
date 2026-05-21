/**
 * One-shot patch: sets isEmailVerified = true for all users
 * who are not yet verified (fixes login for all seeded accounts).
 *
 * Run once from the Backend folder:
 *   node fix-email-verified.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...\n');

  const result = await User.updateMany(
    { isEmailVerified: false },
    { $set: { isEmailVerified: true } }
  );

  console.log(`✅  Updated ${result.modifiedCount} user(s) — isEmailVerified set to true.`);

  // Print all users so you can confirm
  const users = await User.find({}).select('email role isEmailVerified isActive').lean();
  console.log('\nCurrent users:\n');
  users.forEach(u => {
    const verified = u.isEmailVerified ? '✅ verified' : '❌ NOT verified';
    const active   = u.isActive        ? 'active'     : 'inactive';
    console.log(`  ${u.email.padEnd(35)} ${u.role.padEnd(18)} ${verified}  (${active})`);
  });

  await mongoose.disconnect();
  console.log('\nDone. You can now log in with all seeded accounts.');
}

fix().catch(err => {
  console.error('❌ Error:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
