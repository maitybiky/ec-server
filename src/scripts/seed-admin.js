import { connectDB, disconnectDB } from '../shared/config/db.js';
import { env } from '../shared/config/env.js';
import { User } from '../models/user.model.js';

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: env.ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing user ${env.ADMIN_EMAIL} to admin.`);
    } else {
      console.log(`Admin ${env.ADMIN_EMAIL} already exists — nothing to do.`);
    }
  } else {
    await User.create({
      name: 'Admin',
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Admin user created: ${env.ADMIN_EMAIL}`);
  }

  await disconnectDB();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
