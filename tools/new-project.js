const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const cur = argv[i];
    if (!cur.startsWith('--')) {
      args._.push(cur);
      continue;
    }
    const key = cur.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dst) {
  fs.cpSync(src, dst, { recursive: true });
}

function replaceInFile(filePath, replacements) {
  const buf = fs.readFileSync(filePath, 'utf8');
  let out = buf;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(v);
  }
  fs.writeFileSync(filePath, out, 'utf8');
}

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    const ents = fs.readdirSync(cur, { withFileTypes: true });
    for (const ent of ents) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile()) out.push(full);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const name = args.name || args._.join(' ');
  const template = (args.template || 'static').toLowerCase();

  if (!name) {
    // eslint-disable-next-line no-console
    console.error('Usage: npm run new -- --name "My Project" --template static|express-hub');
    process.exit(1);
  }

  const slug = args.slug ? slugify(args.slug) : slugify(name);
  if (!slug) {
    // eslint-disable-next-line no-console
    console.error('Could not generate a slug from the name. Provide --slug "my-project".');
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const projectsDir = path.join(repoRoot, 'Projects');
  const destDir = path.join(projectsDir, name);

  if (!fs.existsSync(projectsDir)) {
    // eslint-disable-next-line no-console
    console.error('Missing Projects/ directory at repo root.');
    process.exit(1);
  }

  if (fs.existsSync(destDir)) {
    // eslint-disable-next-line no-console
    console.error(`Project folder already exists: ${path.relative(repoRoot, destDir)}`);
    process.exit(1);
  }

  const templatesRoot = path.join(repoRoot, 'tools', 'templates');
  const templateDir = path.join(templatesRoot, template);
  if (!fs.existsSync(templateDir)) {
    // eslint-disable-next-line no-console
    console.error(`Unknown template "${template}". Available: static, express-hub`);
    process.exit(1);
  }

  ensureDir(destDir);
  copyDir(templateDir, destDir);

  const replacements = {
    '__PROJECT_NAME__': String(name).trim(),
    '__PROJECT_SLUG__': slug
  };

  for (const fp of walkFiles(destDir)) {
    // Only replace placeholders in text-like files
    const lower = fp.toLowerCase();
    const isText = ['.js', '.json', '.md', '.html', '.css', '.txt'].some((ext) => lower.endsWith(ext));
    if (isText) replaceInFile(fp, replacements);
  }

  // eslint-disable-next-line no-console
  console.log('\n✓ Created new project:');
  // eslint-disable-next-line no-console
  console.log(`  - Name: ${name}`);
  // eslint-disable-next-line no-console
  console.log(`  - Slug: ${slug}`);
  // eslint-disable-next-line no-console
  console.log(`  - Template: ${template}`);
  // eslint-disable-next-line no-console
  console.log('\nNext:');
  // eslint-disable-next-line no-console
  console.log(`  - Start hub: npm start`);
  // eslint-disable-next-line no-console
  console.log(`  - Open: http://localhost:3000/p/${slug}/\n`);
}

main();


