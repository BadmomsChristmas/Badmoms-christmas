// Creates (or updates the password for) an admin user.
// Usage:
//   ADMIN_NAME="Jane Doe" ADMIN_EMAIL="jane@example.org" ADMIN_PASSWORD="something-strong" npm run seed:admin
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error(
      "Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables and re-run.\n" +
        'Example: ADMIN_EMAIL="you@example.org" ADMIN_PASSWORD="something-strong" ADMIN_NAME="Your Name" npm run seed:admin'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
