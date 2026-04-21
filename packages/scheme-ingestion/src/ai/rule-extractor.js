import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

let client = null;

function getClient() {
  if (!client) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not set. Set it in .env or environment.");
    }
    client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a government scheme eligibility rule parser for Saashakti, a women\'s welfare platform in Chhattisgarh, India.

Your job: Convert free-text eligibility descriptions into structured, machine-readable rules.

AVAILABLE FIELDS (these are the profile fields you can match against):
- age: number (woman's age in years)
- maritalStatus: "single" | "married" | "widowed" | "divorced" | "deserted"
- casteCategory: "general" | "obc" | "sc" | "st"
- residenceType: "rural" | "urban"
- stateDomicile: string (e.g. "Chhattisgarh")
- isBpl: boolean (Below Poverty Line)
- hasRationCard: boolean
- hasBankAccount: boolean
- hasJanDhanAccount: boolean
- ownsLand: boolean
- ownsPuccaHouse: boolean
- hasLpgConnection: boolean
- numChildren: number
- isPregnant: boolean
- isLactating: boolean
- hasGirlChild: boolean
- isShgMember: boolean
- hasDisability: boolean
- hasPaidMaternityLeave: boolean
- isGovtPsuEmployee: boolean
- familyIsTaxpayer: boolean
- familyGovtEmployee: boolean
- familyIsElectedRep: boolean

AVAILABLE OPERATORS:
- "eq": equals (exact match)
- "gte": greater than or equal
- "lte": less than or equal
- "in": value is one of array
- "truthy": field is true/non-zero
- "falsy": field is false/zero/null

OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "rules": [
    { "field": "...", "operator": "...", "value": ..., "labelHi": "...", "labelEn": "..." }
  ],
  "exclusions": [
    { "field": "...", "value": ..., "ruleHi": "...", "ruleEn": "..." }
  ],
  "benefitAmount": number or null,
  "benefitFrequency": "monthly" | "annual" | "one_time" | "on_event" | "continuous",
  "annualValueInr": number,
  "needCategory": "maternity" | "pension" | "health" | "housing" | "food_nutrition" | "enterprise" | "skill_employment" | "girl_child_education" | "safety_protection" | "financial_inclusion" | "livelihood" | "agriculture" | "child_welfare" | "disability" | "labour_welfare" | "basic_infrastructure" | "general_welfare",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation of why these rules were chosen"
}

IMPORTANT RULES:
1. Only use fields from the AVAILABLE FIELDS list above.
2. Every rule must have labelHi (Hindi) and labelEn (English) descriptions.
3. Exclusions are conditions that DISQUALIFY someone (e.g., "family is income tax payer").
4. If the eligibility text mentions Chhattisgarh specifically, add a stateDomicile rule.
5. Be conservative — only add rules you are confident about from the text.
6. Return ONLY the JSON object, no markdown, no explanation outside the JSON.`;

/**
 * Extract structured rules from eligibility text using Claude API
 */
export async function extractRulesWithAI(schemeData) {
  const { schemeName, eligibilityText, benefitSummary, applicationProcessText, fullText } = schemeData;

  const userPrompt = `Extract eligibility rules for this government scheme:

SCHEME NAME: ${schemeName}

ELIGIBILITY TEXT:
${eligibilityText || "Not available"}

BENEFIT DESCRIPTION:
${benefitSummary || "Not available"}

APPLICATION PROCESS:
${applicationProcessText || "Not available"}

ADDITIONAL CONTEXT:
${(fullText || "").slice(0, 2000)}

Parse this into structured rules. Return ONLY the JSON object.`;

  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0]?.text || "";

  // Parse JSON from response
  try {
    // Handle case where model wraps in markdown code block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      rules: parsed.rules || [],
      exclusions: parsed.exclusions || [],
      benefitAmount: parsed.benefitAmount || null,
      benefitFrequency: parsed.benefitFrequency || "one_time",
      annualValueInr: parsed.annualValueInr || 0,
      needCategory: parsed.needCategory || "general_welfare",
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || "",
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    };
  } catch (parseErr) {
    return {
      success: false,
      error: `Failed to parse AI response: ${parseErr.message}`,
      rawResponse: text.slice(0, 500),
      rules: [],
      exclusions: [],
      confidence: 0,
    };
  }
}

/**
 * Batch extract rules for multiple candidates
 * Rate limited to 1 request per 2 seconds to avoid API throttling
 */
export async function batchExtractRules(candidates, options = {}) {
  const { delayMs = 2000, maxConcurrent = 1 } = options;
  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    console.log(`  [${i + 1}/${candidates.length}] Processing: ${candidate.schemeName}...`);

    try {
      const result = await extractRulesWithAI({
        schemeName: candidate.schemeName,
        eligibilityText: candidate.eligibilityText,
        benefitSummary: candidate.benefitSummary,
        applicationProcessText: candidate.applicationProcessText,
        fullText: candidate.rawText,
      });

      results.push({
        candidate,
        aiRules: result,
      });

      if (result.success) {
        console.log(`    ✅ ${result.rules.length} rules, ${result.exclusions.length} exclusions (confidence: ${result.confidence})`);
      } else {
        console.log(`    ⚠️ Failed: ${result.error}`);
      }
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
      results.push({ candidate, aiRules: { success: false, error: err.message, rules: [], exclusions: [], confidence: 0 } });
    }

    // Rate limiting
    if (i < candidates.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Detect what changed between two versions of a scheme page
 */
export async function detectSchemeChanges(oldText, newText, schemeName) {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Compare these two versions of the government scheme "${schemeName}" and list what changed.

OLD VERSION (excerpt):
${(oldText || "").slice(0, 1500)}

NEW VERSION (excerpt):
${(newText || "").slice(0, 1500)}

Return a JSON object:
{
  "hasSignificantChanges": boolean,
  "changes": [
    { "type": "eligibility_changed" | "benefit_changed" | "process_changed" | "new_content" | "removed_content", "description": "..." }
  ],
  "summary": "one line summary"
}
Return ONLY the JSON.`
    }],
  });

  try {
    const text = response.content[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { hasSignificantChanges: false, changes: [], summary: "Could not parse changes" };
  }
}
