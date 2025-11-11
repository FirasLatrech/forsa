import { z } from 'zod';
import { baseProcedure  , createTRPCRouter } from '../init';
import { db } from '@/db';
import { category } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export const categoriesRouter = createTRPCRouter({
    getAll: baseProcedure.query(async () => {
        const categories = await db
            .select()
            .from(category)
            .where(eq(category.isActive, true))
            .orderBy(asc(category.displayOrder));

        return categories;
    }),

    getById: baseProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const [categoryData] = await db
                .select()
                .from(category)
                .where(eq(category.id, input.id))
                .limit(1);

            if (!categoryData) {
                throw new Error('Category not found');
            }

            return categoryData;
        }),

    getBySlug: baseProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ input }) => {
            const [categoryData] = await db
                .select()
                .from(category)
                .where(eq(category.slug, input.slug))
                .limit(1);

            if (!categoryData) {
                throw new Error('Category not found');
            }

            return categoryData;
        }),
});

