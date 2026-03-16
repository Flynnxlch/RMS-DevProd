import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Format date to "Month. YYYY" format (e.g., "Nov. 2023")
 */
function formatMemberSince(date = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month}. ${year}`;
}

async function main() {
  console.log('🌱 Starting seed...');
  console.log('📝 Creating users only (no sample data)...\n');

  // Create admin user (ADMIN_PUSAT)
  // Fields match registration form: Nama, Email, Cabang, NIP, Password
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@adminlte.io' },
    update: {},
    create: {
      email: 'admin@adminlte.io',
      passwordHash: adminPassword,
      name: 'Sawit Gila', // Nama
      userRole: 'RISK_ASSESSMENT',
      regionCabang: 'KPS', // Cabang
      nip: '101010010110101', // NIP
      memberSince: formatMemberSince(new Date('2023-11-01')), // Can set to any date for seed
    },
  });
  console.log('✅ Created admin user:', admin.email);
  console.log('   - Name:', admin.name);
  console.log('   - Cabang:', admin.regionCabang);
  console.log('   - NIP:', admin.nip);
  console.log('   - Role: RISK_ASSESSMENT');
  console.log('   - Password: admin123\n');

  // Create Risk Champion user (RISK_CHAMPION)
  const adminCabangPassword = await bcrypt.hash('admin123', 10);
  const adminCabang = await prisma.user.upsert({
    where: { email: 'admincabang@adminlte.io' },
    update: {},
    create: {
      email: 'admincabang@adminlte.io',
      passwordHash: adminCabangPassword,
      name: 'Risk Champion', // Nama
      userRole: 'RISK_CHAMPION',
      regionCabang: 'CGK', // Cabang
      nip: '1234567890', // NIP
      memberSince: formatMemberSince(new Date('2024-01-01')), // Can set to any date for seed
    },
  });
  console.log('✅ Created Risk Champion user:', adminCabang.email);
  console.log('   - Name:', adminCabang.name);
  console.log('   - Cabang:', adminCabang.regionCabang);
  console.log('   - NIP:', adminCabang.nip);
  console.log('   - Role: RISK_CHAMPION');
  console.log('   - Password: admin123\n');

  // Create regular user (RISK_OFFICER)
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@adminlte.io' },
    update: {},
    create: {
      email: 'user@adminlte.io',
      passwordHash: userPassword,
      name: 'Regular User', // Nama
      userRole: 'RISK_OFFICER',
      regionCabang: 'CGK', // Cabang
      nip: '9876543210', // NIP
      memberSince: formatMemberSince(new Date('2024-02-01')), // Can set to any date for seed
    },
  });
  console.log('✅ Created regular user:', user.email);
  console.log('   - Name:', user.name);
  console.log('   - Cabang:', user.regionCabang);
  console.log('   - NIP:', user.nip);
  console.log('   - Role: RISK_OFFICER');
  console.log('   - Password: user123\n');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   - Created 3 users (1 Risk Assessment, 1 Risk Champion, 1 Risk Officer)');
  console.log('   - No sample risks, mitigations, or evaluations created');
  console.log('   - Users can now log in and start using the system');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    throw e; // Re-throw to exit with error code
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
