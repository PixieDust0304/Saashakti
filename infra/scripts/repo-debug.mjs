import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const requiredPaths = [
  'apps/mobile',
  'apps/admin-web',
  'apps/api',
  'apps/api/src/server.js',
  'apps/api/src/routes/auth.js',
  'apps/api/src/services/otp-service.js',
  'apps/api/src/routes/beneficiaries.js',
  'apps/api/src/routes/dashboard.js',
  'apps/api/src/routes/schemes.js',
  'apps/api/src/services/beneficiary-store.js',
  'apps/api/src/services/matching-service.js',
  'apps/api/src/db/postgres.js',
  'apps/api/src/db/redis.js',
  'apps/api/src/services/otp-store-redis.js',
  'apps/api/src/services/beneficiary-store-pg.js',
  'apps/api/src/middleware/auth.js',
  'apps/api/src/utils/logger.js',
  'infra/docker/docker-compose.yml',
  'infra/sql/002_persistence_upgrade.sql',
  'packages/scheme-engine/src/index.js',
  'packages/scheme-registry/src/data/schemes.json',
  'packages/types/src/index.js',
  'infra/sql/001_initial_schema.sql',
  'AGENTS.md',
  'README.md',
];

const failures = [];

const checkPathExists = async (relativePath) => {
  try {
    await access(path.join(root, relativePath), constants.F_OK);
    return true;
  } catch {
    failures.push(`Missing required path: ${relativePath}`);
    return false;
  }
};

const runGitStatusCheck = () => {
  try {
    const status = execSync('git status --short', { cwd: root, encoding: 'utf8' }).trim();
    console.log(status ? `ℹ️  Working tree has changes:\n${status}` : '✅ Working tree is clean');
  } catch (error) {
    failures.push(`Unable to run git status: ${String(error)}`);
  }
};

const runSchemeRegistryValidation = async () => {
  try {
    const { validateRegistry } = await import(path.join(root, 'packages/scheme-registry/src/schema.js'));
    const raw = await readFile(path.join(root, 'packages/scheme-registry/src/data/schemes.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const registry = validateRegistry(parsed);
    console.log(`✅ Registry loaded: version ${registry.version}, schemes=${registry.schemes.length}`);
  } catch (error) {
    failures.push(`Scheme registry validation failed: ${String(error)}`);
  }
};

const runEngineSmoke = async () => {
  try {
    const { matchSchemes } = await import(path.join(root, 'packages/scheme-engine/src/index.js'));
    const { schemeRegistry } = await import(path.join(root, 'packages/scheme-registry/src/index.js'));

    const sampleProfile = {
      age: 29,
      district: 'Lucknow',
      maritalStatus: 'married',
      casteCategory: 'obc',
      annualIncome: 95000,
      isBpl: true,
      hasBankAccount: true,
      hasRationCard: true,
      isPregnant: true,
      isLactating: false,
      isShgMember: true,
      hasDisability: false,
    };

    const results = matchSchemes(sampleProfile, schemeRegistry.schemes);
    if (results.length === 0) {
      failures.push('Scheme engine smoke failed: no matches returned');
      return;
    }

    console.log(`✅ Engine smoke: ${results.length} schemes evaluated; top=${results[0].schemeId} (${results[0].status})`);
  } catch (error) {
    failures.push(`Scheme engine smoke failed: ${String(error)}`);
  }
};

const main = async () => {
  console.log(`Saashakti debug run @ ${new Date().toISOString()}`);
  console.log(`Node ${process.version}`);

  await Promise.all(requiredPaths.map((relativePath) => checkPathExists(relativePath)));
  runGitStatusCheck();
  await runSchemeRegistryValidation();
  await runEngineSmoke();

  if (failures.length > 0) {
    console.error('\n❌ Debug checks found issues:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('\n✅ Debug checks passed');
};

main();
