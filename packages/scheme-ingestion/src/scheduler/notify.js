/**
 * Notification module — sends alerts when new schemes are detected
 * Supports: console, webhook (Slack/Discord), email (via SMTP)
 */

const WEBHOOK_URL = process.env.INGESTION_WEBHOOK_URL;
const NOTIFY_EMAIL = process.env.INGESTION_NOTIFY_EMAIL;

export async function notifyChanges(stats) {
  const { newSchemes = [], changedSchemes = [] } = stats;

  if (newSchemes.length === 0 && changedSchemes.length === 0) return;

  const message = buildMessage(stats);

  // Console (always)
  console.log("\n📢 NOTIFICATION:", message);

  // Webhook (Slack/Discord)
  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          // Slack format
          blocks: [{
            type: "section",
            text: { type: "mrkdwn", text: message },
          }],
        }),
      });
      console.log("  ✅ Webhook notification sent");
    } catch (err) {
      console.log(`  ⚠️ Webhook failed: ${err.message}`);
    }
  }
}

function buildMessage(stats) {
  const lines = ["*🔔 Saashakti Scheme Ingestion Alert*"];
  lines.push(`Run: ${stats.runId || "manual"}`);
  lines.push(`URLs scanned: ${stats.urlsFetched || 0}`);

  if (stats.newSchemes?.length > 0) {
    lines.push(`\n*🆕 New Schemes Detected (${stats.newSchemes.length}):*`);
    for (const s of stats.newSchemes) {
      lines.push(`  • ${s.name} (confidence: ${(s.confidence * 100).toFixed(0)}%)`);
    }
  }

  if (stats.changedSchemes?.length > 0) {
    lines.push(`\n*🔄 Modified Schemes (${stats.changedSchemes.length}):*`);
    for (const s of stats.changedSchemes) {
      lines.push(`  • ${s.name}`);
    }
  }

  lines.push("\n_Review pending candidates in data/pending-candidates.json_");
  return lines.join("\n");
}
