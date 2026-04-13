export function suggestRules(candidate) {
  const rules = [];
  const text = [candidate.schemeName, candidate.benefitSummary, candidate.eligibilityText, candidate.applicationProcessText]
    .filter(Boolean).join(' ').toLowerCase();

  if (/pregnant|गर्भवती/.test(text))
    rules.push({ field: 'isPregnant', operator: 'truthy', labelHi: 'गर्भवती', labelEn: 'Pregnant' });
  if (/bpl|ration|राशन|गरीबी/.test(text))
    rules.push({ field: 'isBpl', operator: 'truthy', labelHi: 'बीपीएल परिवार', labelEn: 'BPL household' });
  if (/bank account|बैंक/.test(text))
    rules.push({ field: 'hasBankAccount', operator: 'truthy', labelHi: 'बैंक खाता', labelEn: 'Has bank account' });
  if (/shg|self help group|स्वयं सहायता/.test(text))
    rules.push({ field: 'isShgMember', operator: 'truthy', labelHi: 'SHG सदस्य', labelEn: 'SHG member' });
  if (/widow|विधवा/.test(text))
    rules.push({ field: 'maritalStatus', operator: 'eq', value: 'widowed', labelHi: 'विधवा', labelEn: 'Widow' });
  if (/girl child|बालिका|बेटी|कन्या/.test(text))
    rules.push({ field: 'hasGirlChild', operator: 'truthy', labelHi: 'बेटी है', labelEn: 'Has girl child' });
  if (/disab|विकलांग|दिव्यांग/.test(text))
    rules.push({ field: 'hasDisability', operator: 'truthy', labelHi: 'विकलांगता', labelEn: 'Has disability' });
  if (/rural|ग्रामीण/.test(text))
    rules.push({ field: 'residenceType', operator: 'eq', value: 'rural', labelHi: 'ग्रामीण', labelEn: 'Rural' });
  if (/sc\/st|अनुसूचित/.test(text))
    rules.push({ field: 'casteCategory', operator: 'in', value: ['sc','st'], labelHi: 'SC/ST', labelEn: 'SC/ST' });

  if (rules.length === 0)
    rules.push({ field: 'hasBankAccount', operator: 'truthy', labelHi: 'बैंक खाता', labelEn: 'Has bank account' });

  return rules;
}
