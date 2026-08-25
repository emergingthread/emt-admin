import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/password';

async function main() {
  try {
    const result = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testx5@example.com',
        role: 'Staff',
        passwordHash: await hashPassword('Password123'),
      },
    });
    console.log('CREATED', JSON.stringify(result));
  } catch (error) {
    console.error('ERROR_NAME', error instanceof Error ? error.name : typeof error);
    console.error('ERROR_CODE', (error as any)?.code);
    console.error('ERROR_MESSAGE', error instanceof Error ? error.message : String(error));
    console.error('ERROR_RAW', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
