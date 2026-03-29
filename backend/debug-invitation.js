import prisma from './src/prisma.js';

async function debug() {
  try {
    console.log('🔍 Checking invitations in database...');
    
    const invitations = await prisma.collegeAdminInvitation.findMany({
      include: {
        college: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${invitations.length} invitations:\n`);
    
    invitations.forEach((inv, i) => {
      console.log(`${i + 1}. ID: ${inv.id}`);
      console.log(`   Token: ${inv.inviteToken.substring(0, 16)}...`);
      console.log(`   Email: ${inv.inviteeEmail}`);
      console.log(`   Name: ${inv.inviteeName}`);
      console.log(`   College: ${inv.college.name}`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Expires: ${inv.expiresAt}`);
      console.log(`   Created: ${inv.createdAt}\n`);
    });

    // Check the specific token from the URL
    const urlToken = 'b8b7464b3ca14e049e10e7e52abd076d40a2490e2b351354cb50f836d5fa9295';
    console.log(`\n🔎 Looking for token: ${urlToken.substring(0, 16)}...`);
    
    const found = await prisma.collegeAdminInvitation.findUnique({
      where: { inviteToken: urlToken }
    });

    if (found) {
      console.log('✅ Token found!', found);
    } else {
      console.log('❌ Token NOT found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
