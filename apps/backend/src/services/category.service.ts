import { eq, and, or, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories } from '../db/schema/categories.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import type { NewCategory } from '../db/schema/categories.js';

// System default categories
const DEFAULT_CATEGORIES = [
    { name: 'Food & Dining', type: 'expense', icon: 'restaurant', color: '#F97316' },
    { name: 'Transport', type: 'expense', icon: 'directions_car', color: '#EF4444' },
    { name: 'Shopping', type: 'expense', icon: 'shopping_bag', color: '#EC4899' },
    { name: 'Entertainment', type: 'expense', icon: 'movie', color: '#8B5CF6' },
    { name: 'Bills & Utilities', type: 'expense', icon: 'bolt', color: '#F59E0B' },
    { name: 'Housing', type: 'expense', icon: 'home', color: '#EF4444' },
    { name: 'Coffee', type: 'expense', icon: 'coffee', color: '#78350F' },
    { name: 'Groceries', type: 'expense', icon: 'shopping_cart', color: '#22C55E' },
    { name: 'Salary', type: 'income', icon: 'work', color: '#10B981' },
    { name: 'Freelance', type: 'income', icon: 'laptop', color: '#06B6D4' },
    { name: 'Investment', type: 'income', icon: 'trending_up', color: '#3B82F6' },
    { name: 'Other Income', type: 'income', icon: 'payments', color: '#10B981' },
] as const;

export async function getCategoriesByUserId(userId: string) {
    // Return system categories + user's custom categories
    return db.query.categories.findMany({
        where: or(
            eq(categories.isSystem, true),
            eq(categories.userId, userId)
        ),
        orderBy: categories.name,
    });
}

export async function getCategoryById(userId: string, categoryId: string) {
    const category = await db.query.categories.findFirst({
        where: and(
            eq(categories.id, categoryId),
            or(eq(categories.isSystem, true), eq(categories.userId, userId))
        ),
    });

    if (!category) {
        throw new NotFoundError('Category');
    }

    return category;
}

export async function createCategory(
    userId: string,
    data: Omit<NewCategory, 'id' | 'userId' | 'isSystem' | 'createdAt'>
) {
    const [category] = await db
        .insert(categories)
        .values({
            ...data,
            userId,
            isSystem: false,
        })
        .returning();

    return category;
}

export async function updateCategory(
    userId: string,
    categoryId: string,
    data: Partial<Omit<NewCategory, 'id' | 'userId' | 'isSystem' | 'createdAt'>>
) {
    const category = await getCategoryById(userId, categoryId);

    if (category.isSystem) {
        throw new ForbiddenError('Cannot modify system categories');
    }

    if (category.userId !== userId) {
        throw new ForbiddenError('Cannot modify this category');
    }

    const [updated] = await db
        .update(categories)
        .set(data)
        .where(eq(categories.id, categoryId))
        .returning();

    return updated;
}

export async function deleteCategory(userId: string, categoryId: string) {
    const category = await getCategoryById(userId, categoryId);

    if (category.isSystem) {
        throw new ForbiddenError('Cannot delete system categories');
    }

    if (category.userId !== userId) {
        throw new ForbiddenError('Cannot delete this category');
    }

    await db.delete(categories).where(eq(categories.id, categoryId));
}

export async function seedSystemCategories() {
    const existingSystem = await db.query.categories.findFirst({
        where: eq(categories.isSystem, true),
    });

    if (existingSystem) {
        return; // Already seeded
    }

    await db.insert(categories).values(
        DEFAULT_CATEGORIES.map((cat) => ({
            ...cat,
            isSystem: true,
            userId: null,
        }))
    );

    console.log('System categories seeded');
}
