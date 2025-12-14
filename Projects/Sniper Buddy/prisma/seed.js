const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function withSchema(databaseUrl, schema) {
  const url = String(databaseUrl || '').trim();
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.set('schema', schema);
  return u.toString();
}

async function main() {
  const seedPath = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(seedPath)) {
    throw new Error(
      `Missing seed-data.json. Run:\n` +
        `  npm run sniper:sqlite:generate\n` +
        `  npm run sniper:export-seed`
    );
  }

  const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: withSchema(process.env.DATABASE_URL, 'sniper_buddy')
      }
    }
  });

  for (const w of data.weapons || []) {
    const weapon = await prisma.weapon.upsert({
      where: { key: w.key },
      update: { name: w.name, scopeMultiplier: w.scopeMultiplier },
      create: { key: w.key, name: w.name, scopeMultiplier: w.scopeMultiplier }
    });

    for (const a of w.ammunition || []) {
      const ammo = await prisma.ammunition.upsert({
        where: { weaponId_key: { weaponId: weapon.id, key: a.key } },
        update: { name: a.name },
        create: { weaponId: weapon.id, key: a.key, name: a.name }
      });

      // Insert ballistics (idempotent)
      const rows = (a.ballistics || []).map((b) => ({
        ammunitionId: ammo.id,
        distance: b.distance,
        mils: b.mils
      }));

      if (rows.length) {
        await prisma.ballisticData.createMany({
          data: rows,
          skipDuplicates: true
        });
      }
    }
  }

  await prisma.$disconnect();
  // eslint-disable-next-line no-console
  console.log('✓ Seed complete');
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


