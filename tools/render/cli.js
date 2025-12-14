#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.render.com/v1';

function readConfig() {
  const configPath = path.join(__dirname, 'render.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Missing tools/render/render.config.json.\n` +
        `Create it from the example:\n` +
        `  Copy-Item tools/render/render.config.example.json tools/render/render.config.json`
    );
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. In PowerShell: $env:${name}="..."`);
  return v;
}

async function api(method, urlPath, body) {
  const key = mustEnv('RENDER_API_KEY');
  const res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg = json?.message || json?.error || text || `${res.status}`;
    const err = new Error(`${method} ${urlPath} failed: ${msg}`);
    err.status = res.status;
    err.body = json || text;
    throw err;
  }
  return json;
}

async function listServices({ name }) {
  // API supports name filter as query param.
  const qs = name ? `?name=${encodeURIComponent(name)}` : '';
  return await api('GET', `/services${qs}`);
}

async function listPostgres({ name, ownerId }) {
  const params = [];
  if (name) params.push(`name=${encodeURIComponent(name)}`);
  if (ownerId) params.push(`ownerId=${encodeURIComponent(ownerId)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return await api('GET', `/postgres${qs}`);
}

async function createPostgres({ ownerId, name, plan, region, version }) {
  const payload = {
    ownerId,
    name,
    plan,
    region,
    version
  };
  return await api('POST', `/postgres`, payload);
}

async function getPostgresConnectionInfo(postgresId) {
  return await api('GET', `/postgres/${encodeURIComponent(postgresId)}/connection-info`);
}

async function updateServiceEnvVars(serviceId, envVars) {
  // Render API expects array: [{ key, value }]
  return await api('PUT', `/services/${encodeURIComponent(serviceId)}/env-vars`, envVars);
}

async function triggerDeploy(serviceId) {
  return await api('POST', `/services/${encodeURIComponent(serviceId)}/deploys`, {});
}

function ensureSchemaParam(connectionString, schema) {
  const u = new URL(connectionString);
  u.searchParams.set('schema', schema);
  return u.toString();
}

async function cmdDoctor() {
  const cfg = readConfig();
  mustEnv('RENDER_API_KEY');
  if (!cfg.ownerId) throw new Error('render.config.json missing ownerId');
  if (!cfg.serviceName) throw new Error('render.config.json missing serviceName');
  if (!cfg.postgresName) throw new Error('render.config.json missing postgresName');
  console.log('✓ Config loaded');
  console.log(`- serviceName: ${cfg.serviceName}`);
  console.log(`- postgresName: ${cfg.postgresName}`);
  console.log(`- region: ${cfg.region}`);
  console.log('✓ Render API key present');
}

async function cmdEnsurePostgres() {
  const cfg = readConfig();
  const list = await listPostgres({ name: cfg.postgresName, ownerId: cfg.ownerId });
  if (list.length) {
    console.log(`✓ Postgres exists: ${list[0].name} (${list[0].id})`);
    return list[0];
  }
  const created = await createPostgres({
    ownerId: cfg.ownerId,
    name: cfg.postgresName,
    plan: cfg.postgresPlan,
    region: cfg.region,
    version: cfg.postgresVersion
  });
  console.log(`✓ Created Postgres: ${created.name} (${created.id})`);
  return created;
}

async function cmdEnsureServiceEnv() {
  const cfg = readConfig();

  const services = await listServices({ name: cfg.serviceName });
  if (!services.length) {
    // Render API limitation: cannot create free-tier services via API.
    if (String(cfg.servicePlan).toLowerCase() === 'free') {
      throw new Error(
        `Service "${cfg.serviceName}" not found.\n` +
          `Render API can't create free-tier web services.\n` +
          `Create the service once in the Render UI, then rerun this command.`
      );
    }
    throw new Error(
      `Service "${cfg.serviceName}" not found.\n` +
        `Create it in the Render UI (Free), or switch to a paid plan and we can add a create-service command.`
    );
  }

  const service = services[0];
  const pgList = await listPostgres({ name: cfg.postgresName, ownerId: cfg.ownerId });
  if (!pgList.length) throw new Error(`Postgres "${cfg.postgresName}" not found. Run: ensure-postgres`);

  const pg = pgList[0];
  const conn = await getPostgresConnectionInfo(pg.id);
  // The API returns various connection strings; we prefer externalConnectionString if present.
  const raw =
    conn?.externalConnectionString ||
    conn?.connectionString ||
    conn?.internalConnectionString ||
    conn?.postgresConnectionString;

  if (!raw) {
    throw new Error(`Could not find a connection string in connection-info response for ${pg.id}`);
  }

  const schema = cfg.appSchemas?.['sniper-buddy'] || 'sniper_buddy';
  const databaseUrl = ensureSchemaParam(raw, schema);

  await updateServiceEnvVars(service.id, [{ key: 'DATABASE_URL', value: databaseUrl }]);
  console.log(`✓ Set DATABASE_URL on service ${service.name}`);
}

async function cmdDeploy() {
  const cfg = readConfig();
  const services = await listServices({ name: cfg.serviceName });
  if (!services.length) throw new Error(`Service "${cfg.serviceName}" not found`);
  const service = services[0];
  const d = await triggerDeploy(service.id);
  console.log(`✓ Deploy triggered: ${d.id || '(id unknown)'} on ${service.name}`);
}

async function main() {
  const cmd = process.argv[2];
  try {
    if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
      console.log(`Usage:
  node tools/render/cli.js doctor
  node tools/render/cli.js ensure-postgres
  node tools/render/cli.js ensure-service-env
  node tools/render/cli.js deploy
`);
      process.exit(0);
    }

    if (cmd === 'doctor') return await cmdDoctor();
    if (cmd === 'ensure-postgres') return await cmdEnsurePostgres();
    if (cmd === 'ensure-service-env') return await cmdEnsureServiceEnv();
    if (cmd === 'deploy') return await cmdDeploy();

    throw new Error(`Unknown command "${cmd}". Use: help`);
  } catch (e) {
    console.error(`\n✗ ${e.message}\n`);
    process.exit(1);
  }
}

main();


