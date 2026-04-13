import { z } from 'zod';

export const ruleSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'neq', 'gte', 'lte', 'in', 'includes', 'truthy']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  labelHi: z.string().min(1),
  labelEn: z.string().min(1),
});

export const schemeSchema = z.object({
  id: z.string().min(1),
  nameHi: z.string().min(1),
  nameEn: z.string().min(1),
  annualValueInr: z.number().nonnegative(),
  rules: z.array(ruleSchema).min(1),
  nextActionHi: z.string().min(1),
  nextActionEn: z.string().min(1),
});

export const schemeRegistrySchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string().datetime(),
  schemes: z.array(schemeSchema).min(1),
});

export type SchemeRegistry = z.infer<typeof schemeRegistrySchema>;

export const validateRegistry = (input: unknown): SchemeRegistry => schemeRegistrySchema.parse(input);
