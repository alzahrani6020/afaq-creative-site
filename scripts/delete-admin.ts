import { prisma } from '../lib/prisma';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/delete-admin.ts <email>');
    process.exit(1);
  }
  const normalized = email.toLowerCase().trim();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalized } });
  if (!admin) {
    console.log('Admin not found.');
    return;
  }
  await prisma.adminUser.delete({ where: { id: admin.id } });
  console.log('Deleted admin:', admin.email);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
