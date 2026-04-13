
/**
 * Enhanced rule suggestion from extracted text
 * Attempts to parse eligibility criteria into structured rules
 */

export function suggestRulesFromText(eligibilityText, benefitText, fullText) {
  const rules = [];
  const allText = [eligibilityText, benefitText, fullText].filter(Boolean).join(' ').toLowerCase();

  // Age rules
  const ageMatch = allText.match(/(?:aged?|आयु|उम्र)[^\d]*(\d{1,2})\s*(?:[+]|years?|वर्ष|साल|and above)/i);
  if (ageMatch) {
    rules.push({ field: 'age', operator: 'gte', value: parseInt(ageMatch[1]), labelHi: `आयु ${ageMatch[1]}+ वर्ष`, labelEn: `Age ${ageMatch[1]}+ years` });
  }
  const maxAgeMatch = allText.match(/(?:below|under|अधिकतम|से\s*कम)\s*(\d{2})\s*(?:years?|वर्ष)/i);
  if (maxAgeMatch) {
    rules.push({ field: 'age', operator: 'lte', value: parseInt(maxAgeMatch[1]), labelHi: `आयु ${maxAgeMatch[1]} से कम`, labelEn: `Age under ${maxAgeMatch[1]}` });
  }

  // Pregnancy
  if (/pregnant|गर्भवती|expectant mother|maternity/i.test(allText)) {
    rules.push({ field: 'isPregnant', operator: 'truthy', labelHi: 'गर्भवती', labelEn: 'Pregnant' });
  }

  // BPL
  if (/bpl|below poverty|गरीबी रेखा|economically weaker/i.test(allText)) {
    rules.push({ field: 'isBpl', operator: 'truthy', labelHi: 'बीपीएल परिवार', labelEn: 'BPL household' });
  }

  // Bank account
  if (/bank account|बैंक खाता|savings account/i.test(allText)) {
    rules.push({ field: 'hasBankAccount', operator: 'truthy', labelHi: 'बैंक खाता', labelEn: 'Has bank account' });
  }

  // Ration card
  if (/ration card|राशन कार्ड/i.test(allText)) {
    rules.push({ field: 'hasRationCard', operator: 'truthy', labelHi: 'राशन कार्ड', labelEn: 'Has ration card' });
  }

  // Widow
  if (/widow|विधवा/i.test(allText) && !/not.*widow/i.test(allText)) {
    rules.push({ field: 'maritalStatus', operator: 'eq', value: 'widowed', labelHi: 'विधवा', labelEn: 'Widow' });
  }

  // Married
  if (/married women|विवाहित महिला/i.test(allText)) {
    rules.push({ field: 'maritalStatus', operator: 'in', value: ['married','widowed','divorced','deserted'], labelHi: 'विवाहित/विधवा/तलाकशुदा', labelEn: 'Married/widow/divorced' });
  }

  // Girl child
  if (/girl child|daughter|बेटी|बालिका|कन्या/i.test(allText)) {
    rules.push({ field: 'hasGirlChild', operator: 'truthy', labelHi: 'बेटी है', labelEn: 'Has girl child' });
  }

  // SHG
  if (/self.help group|shg|स्वयं सहायता समूह/i.test(allText)) {
    rules.push({ field: 'isShgMember', operator: 'truthy', labelHi: 'SHG सदस्य', labelEn: 'SHG member' });
  }

  // Rural
  if (/rural|ग्रामीण|gramin/i.test(allText) && !/urban.*rural/i.test(allText)) {
    rules.push({ field: 'residenceType', operator: 'eq', value: 'rural', labelHi: 'ग्रामीण निवासी', labelEn: 'Rural resident' });
  }

  // SC/ST
  if (/\bsc\b.*\bst\b|scheduled caste|scheduled tribe|अनुसूचित जाति|अनुसूचित जनजाति/i.test(allText)) {
    rules.push({ field: 'casteCategory', operator: 'in', value: ['sc','st'], labelHi: 'SC/ST वर्ग', labelEn: 'SC/ST category' });
  }

  // Land ownership
  if (/land.*own|own.*land|कृषि भूमि|agricultural land/i.test(allText)) {
    rules.push({ field: 'ownsLand', operator: 'truthy', labelHi: 'कृषि भूमि', labelEn: 'Owns farmland' });
  }

  // Disability
  if (/disab|विकलांग|दिव्यांग|differently.abled/i.test(allText)) {
    rules.push({ field: 'hasDisability', operator: 'truthy', labelHi: 'विकलांगता', labelEn: 'Has disability' });
  }

  // Chhattisgarh domicile
  if (/chhattisgarh|छत्तीसगढ़/i.test(allText) && /resident|domicile|निवासी|मूल निवास|\bin\b|of\s+chhattisgarh/i.test(allText)) {
    rules.push({ field: 'stateDomicile', operator: 'eq', value: 'Chhattisgarh', labelHi: 'छत्तीसगढ़ निवासी', labelEn: 'CG resident' });
  }

  // No LPG
  if (/no.*lpg|without.*lpg|lpg.*not|एलपीजी.*नहीं/i.test(allText)) {
    rules.push({ field: 'hasLpgConnection', operator: 'falsy', labelHi: 'एलपीजी कनेक्शन नहीं', labelEn: 'No LPG connection' });
  }

  // No pucca house
  if (/no.*pucca|houseless|कच्चा|बेघर|आवासहीन/i.test(allText)) {
    rules.push({ field: 'ownsPuccaHouse', operator: 'falsy', labelHi: 'पक्का मकान नहीं', labelEn: 'No pucca house' });
  }

  // Income ceiling
  const incomeMatch = allText.match(/(?:income|आय)[^\d]*(?:rs\.?|₹|rupees?)\s?([\d,]+)/i);
  if (incomeMatch) {
    const amount = parseInt(incomeMatch[1].replace(/,/g, ''));
    if (amount > 0 && amount < 10000000) {
      rules.push({ field: 'annualIncome', operator: 'lte', value: amount, labelHi: `वार्षिक आय ≤ ₹${amount.toLocaleString('en-IN')}`, labelEn: `Annual income ≤ ₹${amount.toLocaleString('en-IN')}` });
    }
  }

  // Fallback
  if (rules.length === 0) {
    rules.push({ field: 'hasBankAccount', operator: 'truthy', labelHi: 'बैंक खाता', labelEn: 'Has bank account' });
  }

  // Dedupe by field
  const seen = new Set();
  return rules.filter(r => {
    const key = `${r.field}:${r.operator}:${r.value || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extract benefit amount from text
 */
export function extractBenefitAmount(text) {
  if (!text) return { amount: null, frequency: 'one_time', annualValue: 0 };
  
  const amountMatch = text.match(/(?:₹|rs\.?|rupees?)\s?([\d,]+(?:\.\d{2})?)\s*(?:\/|per)?\s*(month|year|annum|monthly|annually|per month|प्रति माह|प्रति वर्ष)?/i);
  
  if (!amountMatch) return { amount: null, frequency: 'one_time', annualValue: 0 };
  
  const amount = parseInt(amountMatch[1].replace(/,/g, ''));
  const freqText = (amountMatch[2] || '').toLowerCase();
  
  let frequency = 'one_time';
  let annualValue = amount;
  
  if (/month|monthly|माह/.test(freqText)) {
    frequency = 'monthly';
    annualValue = amount * 12;
  } else if (/year|annum|annually|वर्ष/.test(freqText)) {
    frequency = 'annual';
    annualValue = amount;
  }
  
  return { amount, frequency, annualValue };
}
