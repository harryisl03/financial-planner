import { z } from 'zod';

// Account schemas
export const createAccountSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['bank', 'ewallet', 'cash', 'credit_card']),
    balance: z.number().default(0),
    accountNumber: z.string().max(50).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

// Transaction schemas
export const createTransactionSchema = z.object({
    accountId: z.string().uuid(),
    categoryId: z.string().uuid(),
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().positive(),
    description: z.string().min(1).max(255),
    date: z.string().datetime().or(z.date()),
    notes: z.string().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    categoryId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    search: z.string().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['income', 'expense']),
    icon: z.string().max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Budget schemas
export const createBudgetSchema = z.object({
    categoryId: z.string().uuid(),
    amount: z.number().positive(),
    periodType: z.enum(['monthly', 'yearly']).default('monthly'),
    startDate: z.string().date(),
    endDate: z.string().date(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

// User preferences schemas
export const updatePreferencesSchema = z.object({
    currency: z.enum(['USD', 'EUR', 'GBP', 'IDR']).optional(),
    language: z.enum(['en', 'es', 'fr', 'id']).optional(),
    theme: z.enum(['dark', 'light']).optional(),
});

// User profile schemas
export const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    image: z.string().url().optional(),
});

// Stats query schema
export const statsQuerySchema = z.object({
    period: z.enum(['week', 'month', 'year', 'lastMonth']).default('month'),
});
