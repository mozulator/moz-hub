const fs = require('fs');
const path = require('path');

async function main() {
  // This client is generated from schema.sqlite.prisma:
  // eslint-disable-next-line global-require
  const { PrismaClient } = require('../generated/prisma/sqlite-client');
  const prisma = new PrismaClient();

  const weapons = await prisma.weapon.findMany({
    orderBy: { key: 'asc' },
    include: {
      ammunition: {
        orderBy: { key: 'asc' },
        include: { ballistics: { orderBy: { distance: 'asc' } } }
      }
    }
  });

  const out = {
    weapons: weapons.map((w) => ({
      key: w.key,
      name: w.name,
      scopeMultiplier: w.scopeMultiplier,
      ammunition: w.ammunition.map((a) => ({
        key: a.key,
        name: a.name,
        ballistics: a.ballistics.map((b) => ({
          distance: b.distance,
          mils: b.mils
        }))
      }))
    }))
  };

  const outPath = path.join(__dirname, 'seed-data.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`✓ Exported seed data to ${outPath}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


