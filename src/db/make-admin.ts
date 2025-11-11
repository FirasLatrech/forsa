import { db } from './index';
import { user } from './schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: bun run src/db/make-admin.ts email@example.com');
  process.exit(1);
}

async function makeAdmin() {
  try {
    const result = await db.update(user)
      .set({ isAdmin: true })
      .where(eq(user.email, email))
      .returning();

    if (result.length === 0) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`✅ ${email} is now an admin!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeAdmin();

