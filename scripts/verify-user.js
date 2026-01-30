const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const argv = require('yargs')
  .option('email', { type: 'string', describe: 'Email del usuario a verificar' })
  .option('confirm', { type: 'boolean', describe: 'Confirmar la ejecución (cambia la base de datos)', default: false })
  .demandOption(['email'])
  .help()
  .argv;

async function main() {
  const email = argv.email;
  const confirm = argv.confirm;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('Usuario no encontrado:', email);
    process.exit(1);
  }

  console.log('Usuario encontrado:', user.id, user.username, 'emailVerified:', user.emailVerified);

  if (user.emailVerified) {
    console.log('El email ya está verificado. No se aplican cambios.');
    await prisma.$disconnect();
    process.exit(0);
  }

  if (!confirm) {
    console.log('Dry-run: ejecutar con --confirm para aplicar los cambios.');
    console.log('Acción propuesta: establecer emailVerified=true y verificationToken=null.');
    await prisma.$disconnect();
    process.exit(0);
  }

  try {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    });
    console.log('Usuario actualizado:', updated.id, updated.username, 'emailVerified:', updated.emailVerified);
  } catch (err) {
    console.error('Error al actualizar el usuario:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});