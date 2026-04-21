#!/bin/bash
# Saashakti Scheme Ingestion — Cron Setup
# Run this once on your server to set up scheduled ingestion

INGESTION_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "Setting up Saashakti scheme ingestion cron jobs..."
echo "Ingestion directory: $INGESTION_DIR"

# Create log directory
mkdir -p "$INGESTION_DIR/logs"

# Write cron entries
CRON_ENTRIES=$(cat << CRON
# ── Saashakti Scheme Ingestion ──
# Tier 1: Daily at 2 AM — myScheme + India Portal
0 2 * * * cd $INGESTION_DIR && node src/scheduler/scheduled-run.js --tier 1 --limit 200 >> logs/tier1.log 2>&1

# Tier 2: Weekly Sunday at 3 AM — CG state/district portals  
0 3 * * 0 cd $INGESTION_DIR && node src/scheduler/scheduled-run.js --tier 2 --limit 50 >> logs/tier2.log 2>&1

# Full run with AI: Monthly 1st at 4 AM — everything + AI rule extraction
0 4 1 * * cd $INGESTION_DIR && ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY node src/scheduler/scheduled-run.js --tier all --ai --limit 300 >> logs/full-ai.log 2>&1
CRON
)

echo ""
echo "Add these to your crontab (crontab -e):"
echo ""
echo "$CRON_ENTRIES"
echo ""
echo "Don't forget to set ANTHROPIC_API_KEY in your environment for AI features."
