import { runScheduledIngestion } from './scheduled-pipeline.js';

/**
 * Cron runner — call this from system cron, PM2, or node-cron
 * 
 * System cron (recommended for production):
 *   0 2 * * * cd /app/packages/scheme-ingestion && node src/scheduler/cron-runner.js >> /var/log/saashakti-ingestion.log 2>&1
 * 
 * Or use node-cron in-process (for dev):
 *   import cron from 'node-cron';
 *   cron.schedule('0 2 * * *', () => runScheduledIngestion());
 */

const args = process.argv.slice(2);
const forceRefresh = args.includes('--force');

console.log(`[${new Date().toISOString()}] Saashakti scheduled ingestion starting...`);
console.log(`  Force refresh: ${forceRefresh}`);

runScheduledIngestion({ forceRefresh })
  .then(result => {
    console.log(`[${new Date().toISOString()}] Ingestion complete:`, JSON.stringify(result.summary, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(`[${new Date().toISOString()}] Ingestion failed:`, err.message);
    process.exit(1);
  });
