import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { product, category } from '@/db/schema';
import { eq, desc, asc, and, like, sql, or } from 'drizzle-orm';

export const productsRouter = createTRPCRouter({
    getMany: baseProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(12),
                search: z.string().optional(),
                categoryId: z.string().optional(),
                isFeatured: z.boolean().optional(),
                isNew: z.boolean().optional(),
                sortBy: z.enum(['newest', 'price-asc', 'price-desc', 'popular']).default('newest'),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize, search, categoryId, isFeatured, isNew, sortBy } = input;
            const offset = (page - 1) * pageSize;

            const conditions = [eq(product.isActive, true)];

            if (search) {
                conditions.push(
                    or(
                        like(product.name, `%${search}%`),
                        like(product.nameAr, `%${search}%`),
                        like(product.description, `%${search}%`),
                        like(product.descriptionAr, `%${search}%`)
                    )!
                );
            }

            if (categoryId) {
                conditions.push(eq(product.categoryId, categoryId));
            }

            if (isFeatured !== undefined) {
                conditions.push(eq(product.isFeatured, isFeatured));
            }

            if (isNew !== undefined) {
                conditions.push(eq(product.isNew, isNew));
            }

            let orderBy;
            switch (sortBy) {
                case 'price-asc':
                    orderBy = asc(product.price);
                    break;
                case 'price-desc':
                    orderBy = desc(product.price);
                    break;
                case 'popular':
                    orderBy = desc(product.viewCount);
                    break;
                case 'newest':
                default:
                    orderBy = desc(product.createdAt);
                    break;
            }

            const [products, totalCountResult] = await Promise.all([
                db
                    .select()
                    .from(product)
                    .where(and(...conditions))
                    .orderBy(orderBy)
                    .limit(pageSize)
                    .offset(offset),
                db
                    .select({ count: sql<number>`count(*)` })
                    .from(product)
                    .where(and(...conditions)),
            ]);

            const totalCount = Number(totalCountResult[0]?.count ?? 0);
            const totalPages = Math.ceil(totalCount / pageSize);

            return {
                products,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            };
        }),

    getById: baseProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const [productData] = await db
                .select()
                .from(product)
                .where(and(eq(product.id, input.id), eq(product.isActive, true)))
                .limit(1);

            if (!productData) {
                throw new Error('Product not found');
            }

            await db
                .update(product)
                .set({ viewCount: sql`${product.viewCount} + 1` })
                .where(eq(product.id, input.id));

            return productData;
        }),

    getBySlug: baseProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ input }) => {
            const [productData] = await db
                .select()
                .from(product)
                .where(and(eq(product.slug, input.slug), eq(product.isActive, true)))
                .limit(1);

            if (!productData) {
                throw new Error('Product not found');
            }

            await db
                .update(product)
                .set({ viewCount: sql`${product.viewCount} + 1` })
                .where(eq(product.id, productData.id));

            return productData;
        }),

    getFeatured: baseProcedure
        .input(z.object({ limit: z.number().min(1).max(20).default(8) }))
        .query(async ({ input }) => {
            const products = await db
                .select()
                .from(product)
                .where(and(eq(product.isActive, true), eq(product.isFeatured, true)))
                .orderBy(desc(product.createdAt))
                .limit(input.limit);

            return products;
        }),

    getNew: baseProcedure
        .input(z.object({ limit: z.number().min(1).max(20).default(8) }))
        .query(async ({ input }) => {
            const products = await db
                .select()
                .from(product)
                .where(and(eq(product.isActive, true), eq(product.isNew, true)))
                .orderBy(desc(product.createdAt))
                .limit(input.limit);

            return products;
        }),
});

