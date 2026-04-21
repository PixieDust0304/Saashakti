import fs from "node:fs";
import { batchExtractRules } from "../ai/rule-extractor.js";

/**
 * CLI: Extract rules from pending candidates using AI
 * 
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node src/cli/ai-extract-rules.js [--input data/pending-candidates.json] [--limit 10]
 */

const args = process.argv.slice(2);
const inputIdx = args.indexOf("--input");
const inputFile = inputIdx >= 0 ? args[inputIdx + 1] : "data/pending-candidates.json";
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 10;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY environment variable required");
    console.error("   Set it: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  console.log("=== AI RULE EXTRACTION ===");
  console.log(`Input: ${inputFile}`);
  console.log(`Limit: ${limit}`);

  let candidates;
  try {
    candidates = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  } catch (err) {
    console.error(`Cannot read ${inputFile}: ${err.message}`);
    console.error("Run the scheduled pipeline first to generate candidates.");
    process.exit(1);
  }

  // Filter to pending only
  const pending = candidates.filter(c => c._review?.status === "pending").slice(0, limit);
  console.log(`Pending candidates: ${pending.length}/${candidates.length}`);

  if (pending.length === 0) {
    console.log("No pending candidates to process.");
    return;
  }

  // Build candidate objects for AI
  const forAI = pending.map(c => ({
    schemeName: c.nameEn || c.nameHi,
    eligibilityText: c._review?.rawEligibilityText || "",
    benefitSummary: c._review?.rawBenefitText || c.benefitDescriptionEn || "",
    applicationProcessText: c.nextActionEn || "",
    rawText: "",
  }));

  console.log("\nProcessing with Claude API...");
  const results = await batchExtractRules(forAI, { delayMs: 2000 });

  // Merge AI results back into candidates
  const output = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const original = pending[i];

    if (r.aiRules.success) {
      output.push({
        ...original,
        rules: r.aiRules.rules,
        exclusions: r.aiRules.exclusions,
        benefitAmount: r.aiRules.benefitAmount ?? original.benefitAmount,
        benefitFrequency: r.aiRules.benefitFrequency ?? original.benefitFrequency,
        annualValueInr: r.aiRules.annualValueInr ?? original.annualValueInr,
        needCategory: r.aiRules.needCategory ?? original.needCategory,
        _review: {
          ...original._review,
          status: "ai_processed",
          aiConfidence: r.aiRules.confidence,
          aiReasoning: r.aiRules.reasoning,
          tokensUsed: r.aiRules.tokensUsed,
          processedAt: new Date().toISOString(),
        },
      });
    } else {
      output.push({
        ...original,
        _review: {
          ...original._review,
          status: "ai_failed",
          aiError: r.aiRules.error,
          processedAt: new Date().toISOString(),
        },
      });
    }
  }

  // Save
  const outFile = "data/ai-processed-candidates.json";
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  // Summary
  const succeeded = output.filter(o => o._review?.status === "ai_processed").length;
  const failed = output.filter(o => o._review?.status === "ai_failed").length;

  console.log(`\n=== RESULTS ===`);
  console.log(`  Processed: ${results.length}`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Output: ${outFile}`);
  console.log(`\nNext step: Review ${outFile} and merge approved schemes into the registry.`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
