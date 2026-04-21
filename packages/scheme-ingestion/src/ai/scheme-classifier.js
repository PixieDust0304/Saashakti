
/**
 * AI-powered scheme classification
 * Auto-tags schemes with needCategory, department, target groups
 */

export async function classifyScheme(schemeText, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Classify this Indian government scheme. Return JSON only.

Scheme text: ${schemeText.slice(0, 2000)}

Return:
{
  "needCategory": one of [maternity, pension, health, housing, food_nutrition, enterprise, skill_employment, girl_child_education, safety_protection, financial_inclusion, livelihood, agriculture, child_welfare, disability, labour_welfare, basic_infrastructure, general_welfare],
  "targetGroups": array of [women, girl_child, pregnant, lactating, widow, bpl, sc_st, obc, farmer, senior_citizen, disabled, shg, construction_worker, student, tribal, minority, urban_poor],
  "womenRelevance": 0.0 to 1.0,
  "department": "department name in Hindi",
  "nameHi": "scheme name in Hindi",
  "nameEn": "scheme name in English"
}

JSON only, no explanation.`
      }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const result = await response.json();
  const text = result.content?.[0]?.text || '';
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return JSON.parse(jsonMatch[0]);
}
