import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { db } from '@/db';
import { product, category, user, randomBox, order, orderItem, userAnalytics, favorite } from '@/db/schema';
import { eq, desc, asc, and, like, sql, or, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { TRPCError } from '@trpc/server';

const adminProcedure = baseProcedure.use(async ({ ctx, next }) => {
    if (!ctx.user?.isAdmin) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
        });
    }
    return next();
});

export const adminRouter = createTRPCRouter({
    products: createTRPCRouter({
        getAll: adminProcedure
            .input(
                z.object({
                    page: z.number().min(1).default(1),
                    pageSize: z.number().min(1).max(100).default(20),
                    search: z.string().optional(),
                    categoryId: z.string().optional(),
                    isActive: z.boolean().optional(),
                })
            )
            .query(async ({ input }) => {
                const { page, pageSize, search, categoryId, isActive } = input;
                const offset = (page - 1) * pageSize;

                const conditions = [];

                if (search) {
                    conditions.push(
                        or(
                            like(product.name, `%${search}%`),
                            like(product.nameAr, `%${search}%`),
                            like(product.sku, `%${search}%`)
                        )!
                    );
                }

                if (categoryId) {
                    conditions.push(eq(product.categoryId, categoryId));
                }

                if (isActive !== undefined) {
                    conditions.push(eq(product.isActive, isActive));
                }

                const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

                const [products, totalCountResult] = await Promise.all([
                    db
                        .select()
                        .from(product)
                        .where(whereClause)
                        .orderBy(desc(product.createdAt))
                        .limit(pageSize)
                        .offset(offset),
                    db
                        .select({ count: sql<number>`count(*)` })
                        .from(product)
                        .where(whereClause),
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

        getById: adminProcedure
            .input(z.object({ id: z.string() }))
            .query(async ({ input }) => {
                const [productData] = await db
                    .select()
                    .from(product)
                    .where(eq(product.id, input.id))
                    .limit(1);

                if (!productData) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Product not found',
                    });
                }

                return productData;
            }),

        create: adminProcedure
            .input(
                z.object({
                    name: z.string().min(1),
                    nameAr: z.string().min(1),
                    description: z.string().optional(),
                    descriptionAr: z.string().optional(),
                    amount: z.string().min(0),
                    categoryId: z.string().min(1),
                    images: z.array(z.string()).optional(),
                    sku: z.string().min(1),
                    stock: z.number().int().default(0),
                    isActive: z.boolean().default(true),
                    isFeatured: z.boolean().default(false),
                })
            )
            .mutation(async ({ input }) => {
                const { amount, ...rest } = input;
                
                const slug = rest.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '') + '-' + nanoid(6);

                const [newProduct] = await db
                    .insert(product)
                    .values({
                        id: nanoid(),
                        ...rest,
                        price: amount,
                        slug,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

                return newProduct;
            }),

        update: adminProcedure
            .input(
                z.object({
                    id: z.string(),
                    name: z.string().min(1).optional(),
                    nameAr: z.string().min(1).optional(),
                    description: z.string().optional(),
                    descriptionAr: z.string().optional(),
                    amount: z.string().optional(),
                    categoryId: z.string().optional(),
                    images: z.array(z.string()).optional(),
                    sku: z.string().optional(),
                    stock: z.number().int().optional(),
                    isActive: z.boolean().optional(),
                    isFeatured: z.boolean().optional(),
                })
            )
            .mutation(async ({ input }) => {
                const { id, amount, ...updateData } = input;

                const finalUpdateData: any = { ...updateData };
                if (amount !== undefined) {
                    finalUpdateData.price = amount;
                }

                const [updatedProduct] = await db
                    .update(product)
                    .set({
                        ...finalUpdateData,
                        updatedAt: new Date(),
                    })
                    .where(eq(product.id, id))
                    .returning();

                if (!updatedProduct) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Product not found',
                    });
                }

                return updatedProduct;
            }),

        delete: adminProcedure
            .input(z.object({ id: z.string() }))
            .mutation(async ({ input }) => {
                await db.delete(product).where(eq(product.id, input.id));
                return { success: true };
            }),
    }),

    categories: createTRPCRouter({
        getAll: adminProcedure
            .input(
                z.object({
                    page: z.number().min(1).default(1),
                    pageSize: z.number().min(1).max(100).default(20),
                    search: z.string().optional(),
                })
            )
            .query(async ({ input }) => {
                const { page, pageSize, search } = input;
                const offset = (page - 1) * pageSize;

                const conditions = [];

                if (search) {
                    conditions.push(
                        or(
                            like(category.name, `%${search}%`),
                            like(category.nameAr, `%${search}%`)
                        )!
                    );
                }

                const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

                const [categories, totalCountResult] = await Promise.all([
                    db
                        .select()
                        .from(category)
                        .where(whereClause)
                        .orderBy(asc(category.name))
                        .limit(pageSize)
                        .offset(offset),
                    db
                        .select({ count: sql<number>`count(*)` })
                        .from(category)
                        .where(whereClause),
                ]);

                const totalCount = Number(totalCountResult[0]?.count ?? 0);
                const totalPages = Math.ceil(totalCount / pageSize);

                return {
                    categories,
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

        getById: adminProcedure
            .input(z.object({ id: z.string() }))
            .query(async ({ input }) => {
                const [categoryData] = await db
                    .select()
                    .from(category)
                    .where(eq(category.id, input.id))
                    .limit(1);

                if (!categoryData) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Category not found',
                    });
                }

                return categoryData;
            }),

        create: adminProcedure
            .input(
                z.object({
                    name: z.string().min(1),
                    nameAr: z.string().min(1),
                    description: z.string().optional(),
                    descriptionAr: z.string().optional(),
                    image: z.string().optional(),
                    isActive: z.boolean().default(true),
                })
            )
            .mutation(async ({ input }) => {
                const slug = input.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '') + '-' + nanoid(6);

                const [newCategory] = await db
                    .insert(category)
                    .values({
                        id: nanoid(),
                        ...input,
                        slug,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

                return newCategory;
            }),

        update: adminProcedure
            .input(
                z.object({
                    id: z.string(),
                    name: z.string().min(1).optional(),
                    nameAr: z.string().min(1).optional(),
                    description: z.string().optional(),
                    descriptionAr: z.string().optional(),
                    image: z.string().optional(),
                    isActive: z.boolean().optional(),
                })
            )
            .mutation(async ({ input }) => {
                const { id, ...updateData } = input;

                const [updatedCategory] = await db
                    .update(category)
                    .set({
                        ...updateData,
                        updatedAt: new Date(),
                    })
                    .where(eq(category.id, id))
                    .returning();

                if (!updatedCategory) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Category not found',
                    });
                }

                return updatedCategory;
            }),

        delete: adminProcedure
            .input(z.object({ id: z.string() }))
            .mutation(async ({ input }) => {
                await db.delete(category).where(eq(category.id, input.id));
                return { success: true };
            }),
    }),

    users: createTRPCRouter({
        getAll: adminProcedure
            .input(
                z.object({
                    page: z.number().min(1).default(1),
                    pageSize: z.number().min(1).max(100).default(20),
                    search: z.string().optional(),
                })
            )
            .query(async ({ input }) => {
                const { page, pageSize, search } = input;
                const offset = (page - 1) * pageSize;

                const conditions = [];

                if (search) {
                    conditions.push(
                        or(
                            like(user.name, `%${search}%`),
                            like(user.email, `%${search}%`)
                        )!
                    );
                }

                const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

                const [users, totalCountResult] = await Promise.all([
                    db
                        .select()
                        .from(user)
                        .where(whereClause)
                        .orderBy(desc(user.createdAt))
                        .limit(pageSize)
                        .offset(offset),
                    db
                        .select({ count: sql<number>`count(*)` })
                        .from(user)
                        .where(whereClause),
                ]);

                const totalCount = Number(totalCountResult[0]?.count ?? 0);
                const totalPages = Math.ceil(totalCount / pageSize);

                return {
                    users,
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

        getById: adminProcedure
            .input(z.object({ id: z.string() }))
            .query(async ({ input }) => {
                const [userData] = await db
                    .select()
                    .from(user)
                    .where(eq(user.id, input.id))
                    .limit(1);

                if (!userData) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'User not found',
                    });
                }

                return userData;
            }),

        update: adminProcedure
            .input(
                z.object({
                    id: z.string(),
                    name: z.string().min(1).optional(),
                    email: z.string().email().optional(),
                    isAdmin: z.boolean().optional(),
                })
            )
            .mutation(async ({ input }) => {
                const { id, ...updateData } = input;

                const [updatedUser] = await db
                    .update(user)
                    .set({
                        ...updateData,
                        updatedAt: new Date(),
                    })
                    .where(eq(user.id, id))
                    .returning();

                if (!updatedUser) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'User not found',
                    });
                }

                return updatedUser;
            }),

        delete: adminProcedure
            .input(z.object({ id: z.string() }))
            .mutation(async ({ input }) => {
                await db.delete(user).where(eq(user.id, input.id));
                return { success: true };
            }),
    }),

    randomBoxes: createTRPCRouter({
        getAll: adminProcedure
            .input(
                z.object({
                    page: z.number().min(1).default(1),
                    pageSize: z.number().min(1).max(100).default(20),
                    search: z.string().optional(),
                    isActive: z.boolean().optional(),
                })
            )
            .query(async ({ input }) => {
                const { page, pageSize, search, isActive } = input;
                const offset = (page - 1) * pageSize;

                const conditions = [];

                if (search) {
                    conditions.push(
                        or(
                            like(randomBox.name, `%${search}%`),
                            like(randomBox.nameAr, `%${search}%`)
                        )!
                    );
                }

                if (isActive !== undefined) {
                    conditions.push(eq(randomBox.isActive, isActive));
                }

                const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

                const [boxes, totalCountResult] = await Promise.all([
                    db
                        .select()
                        .from(randomBox)
                        .where(whereClause)
                        .orderBy(asc(randomBox.displayOrder))
                        .limit(pageSize)
                        .offset(offset),
                    db
                        .select({ count: sql<number>`count(*)` })
                        .from(randomBox)
                        .where(whereClause),
                ]);

                const totalCount = Number(totalCountResult[0]?.count ?? 0);
                const totalPages = Math.ceil(totalCount / pageSize);

                return {
                    boxes,
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

        getById: adminProcedure
            .input(z.object({ id: z.string() }))
            .query(async ({ input }) => {
                const [box] = await db
                    .select()
                    .from(randomBox)
                    .where(eq(randomBox.id, input.id))
                    .limit(1);

                if (!box) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Random box not found',
                    });
                }

                return box;
            }),

        create: adminProcedure
            .input(
                z.object({
                    name: z.string().min(1),
                    nameAr: z.string().min(1),
                    description: z.string().optional(),
                    descriptionAr: z.string().optional(),
                    amount: z.string().min(0),
                    minValue: z.string().min(0),
                    maxValue: z.string().optional(),
                    colorGradient: z.string().min(1),
                    icon: z.string().min(1),
                    displayOrder: z.number().int().default(0),
                    isActive: z.boolean().default(true),
                    stock: z.number().int().default(0),
                    productIds: z.array(z.string()).optional(),
                })
            )
            .mutation(async ({ input }) => {
                const [newBox] = await db
                    .insert(randomBox)
                    .values({
                        id: nanoid(),
                        ...input,
                        soldCount: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

                return newBox;
            }),

        update: adminProcedure
            .input(
                z.object({
                    id: z.string(),
                    name: z.string().min(1).optional(),
                    nameAr: z.string().min(1).optional(),
                    description: z.string().optional(),
                    descriptionAr: z.string().optional(),
                    amount: z.string().optional(),
                    minValue: z.string().optional(),
                    maxValue: z.string().optional(),
                    colorGradient: z.string().optional(),
                    icon: z.string().optional(),
                    displayOrder: z.number().int().optional(),
                    isActive: z.boolean().optional(),
                    stock: z.number().int().optional(),
                    productIds: z.array(z.string()).optional(),
                })
            )
            .mutation(async ({ input }) => {
                const { id, ...updateData } = input;

                const [updatedBox] = await db
                    .update(randomBox)
                    .set({
                        ...updateData,
                        updatedAt: new Date(),
                    })
                    .where(eq(randomBox.id, id))
                    .returning();

                if (!updatedBox) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Random box not found',
                    });
                }

                return updatedBox;
            }),

        delete: adminProcedure
            .input(z.object({ id: z.string() }))
            .mutation(async ({ input }) => {
                await db.delete(randomBox).where(eq(randomBox.id, input.id));
                return { success: true };
            }),
    }),

    orders: createTRPCRouter({
        getAll: adminProcedure
            .input(
                z.object({
                    page: z.number().min(1).default(1),
                    pageSize: z.number().min(1).max(100).default(20),
                    search: z.string().optional(),
                    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
                })
            )
            .query(async ({ input }) => {
                const { page, pageSize, search, status } = input;
                const offset = (page - 1) * pageSize;

                const conditions = [];

                if (search) {
                    conditions.push(
                        or(
                            like(order.orderNumber, `%${search}%`),
                            like(order.shippingName, `%${search}%`),
                            like(order.shippingPhone, `%${search}%`)
                        )!
                    );
                }

                if (status) {
                    conditions.push(eq(order.status, status));
                }

                const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

                const [orders, totalCountResult] = await Promise.all([
                    db
                        .select()
                        .from(order)
                        .where(whereClause)
                        .orderBy(desc(order.createdAt))
                        .limit(pageSize)
                        .offset(offset),
                    db
                        .select({ count: sql<number>`count(*)` })
                        .from(order)
                        .where(whereClause),
                ]);

                const totalCount = Number(totalCountResult[0]?.count ?? 0);
                const totalPages = Math.ceil(totalCount / pageSize);

                return {
                    orders,
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

        getById: adminProcedure
            .input(z.object({ id: z.string() }))
            .query(async ({ input }) => {
                const [orderData] = await db
                    .select()
                    .from(order)
                    .where(eq(order.id, input.id))
                    .limit(1);

                if (!orderData) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Order not found',
                    });
                }

                const items = await db
                    .select()
                    .from(orderItem)
                    .where(eq(orderItem.orderId, input.id));

                return {
                    ...orderData,
                    items,
                };
            }),

        updateStatus: adminProcedure
            .input(
                z.object({
                    id: z.string(),
                    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
                    trackingNumber: z.string().optional(),
                })
            )
            .mutation(async ({ input }) => {
                const { id, status, trackingNumber } = input;

                const updateData: any = {
                    status,
                    updatedAt: new Date(),
                };

                if (trackingNumber !== undefined) {
                    updateData.trackingNumber = trackingNumber;
                }

                if (status === 'delivered') {
                    updateData.completedAt = new Date();
                }

                const [updatedOrder] = await db
                    .update(order)
                    .set(updateData)
                    .where(eq(order.id, id))
                    .returning();

                if (!updatedOrder) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Order not found',
                    });
                }

                return updatedOrder;
            }),

        update: adminProcedure
            .input(
                z.object({
                    id: z.string(),
                    shippingName: z.string().min(1).optional(),
                    shippingPhone: z.string().min(1).optional(),
                    shippingAddress: z.string().min(1).optional(),
                    shippingCity: z.string().min(1).optional(),
                    notes: z.string().optional(),
                    paymentMethod: z.string().optional(),
                })
            )
            .mutation(async ({ input }) => {
                const { id, ...updateData } = input;

                const [updatedOrder] = await db
                    .update(order)
                    .set({
                        ...updateData,
                        updatedAt: new Date(),
                    })
                    .where(eq(order.id, id))
                    .returning();

                if (!updatedOrder) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Order not found',
                    });
                }

                return updatedOrder;
            }),

        delete: adminProcedure
            .input(z.object({ id: z.string() }))
            .mutation(async ({ input }) => {
                await db.delete(order).where(eq(order.id, input.id));
                return { success: true };
            }),
    }),

    stats: createTRPCRouter({
        getOverview: adminProcedure.query(async () => {
            const [totalProducts] = await db
                .select({ count: sql<number>`count(*)` })
                .from(product);

            const [activeProducts] = await db
                .select({ count: sql<number>`count(*)` })
                .from(product)
                .where(eq(product.isActive, true));

            const [totalCategories] = await db
                .select({ count: sql<number>`count(*)` })
                .from(category);

            const [totalUsers] = await db
                .select({ count: sql<number>`count(*)` })
                .from(user);

            return {
                totalProducts: Number(totalProducts?.count ?? 0),
                activeProducts: Number(activeProducts?.count ?? 0),
                totalCategories: Number(totalCategories?.count ?? 0),
                totalUsers: Number(totalUsers?.count ?? 0),
            };
        }),
    }),
    analytics: createTRPCRouter({
        getTopSearches: adminProcedure
            .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
            .query(async ({ input }) => {
                const searches = await db
                    .select({
                        query: userAnalytics.searchQuery,
                        count: sql<number>`count(*)::int`,
                    })
                    .from(userAnalytics)
                    .where(
                        and(
                            eq(userAnalytics.eventType, 'search'),
                            isNotNull(userAnalytics.searchQuery)
                        )
                    )
                    .groupBy(userAnalytics.searchQuery)
                    .orderBy(desc(sql<number>`count(*)`))
                    .limit(input.limit);

                return searches.map(s => ({
                    query: s.query!,
                    count: Number(s.count),
                }));
            }),

        getMostFavorited: adminProcedure
            .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
            .query(async ({ input }) => {
                const favorites = await db
                    .select({
                        productId: favorite.productId,
                        count: sql<number>`count(*)::int`,
                        product: product,
                    })
                    .from(favorite)
                    .leftJoin(product, eq(favorite.productId, product.id))
                    .groupBy(favorite.productId, product.id)
                    .orderBy(desc(sql<number>`count(*)`))
                    .limit(input.limit);

                return favorites
                    .filter(f => f.product)
                    .map(f => ({
                        productId: f.productId,
                        favoriteCount: Number(f.count),
                        product: f.product!,
                    }));
            }),

        getMostViewed: adminProcedure
            .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
            .query(async ({ input }) => {
                const views = await db
                    .select({
                        productId: userAnalytics.productId,
                        count: sql<number>`count(*)::int`,
                        product: product,
                    })
                    .from(userAnalytics)
                    .leftJoin(product, eq(userAnalytics.productId, product.id))
                    .where(eq(userAnalytics.eventType, 'view_product'))
                    .groupBy(userAnalytics.productId, product.id)
                    .orderBy(desc(sql<number>`count(*)`))
                    .limit(input.limit);

                return views
                    .filter(v => v.product)
                    .map(v => ({
                        productId: v.productId!,
                        viewCount: Number(v.count),
                        product: v.product!,
                    }));
            }),

        getBestProducts: adminProcedure
            .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
            .query(async ({ input }) => {
                const productStats = await db
                    .select({
                        productId: product.id,
                        product: product,
                        views: sql<number>`COALESCE((
                            SELECT COUNT(*)::int 
                            FROM ${userAnalytics} 
                            WHERE ${userAnalytics.productId} = ${product.id} 
                            AND ${userAnalytics.eventType} = 'view_product'
                        ), 0)`,
                        favorites: sql<number>`COALESCE((
                            SELECT COUNT(*)::int 
                            FROM ${favorite} 
                            WHERE ${favorite.productId} = ${product.id}
                        ), 0)`,
                        purchases: sql<number>`COALESCE((
                            SELECT COUNT(*)::int 
                            FROM ${orderItem} 
                            WHERE ${orderItem.productId} = ${product.id}
                        ), 0)`,
                    })
                    .from(product)
                    .where(eq(product.isActive, true))
                    .limit(100);

                const scored = productStats.map(p => ({
                    ...p,
                    score: Number(p.views) * 1 + Number(p.favorites) * 3 + Number(p.purchases) * 5,
                }));

                return scored
                    .sort((a, b) => b.score - a.score)
                    .slice(0, input.limit)
                    .map(item => ({
                        productId: item.productId,
                        product: item.product,
                        views: Number(item.views),
                        favorites: Number(item.favorites),
                        purchases: Number(item.purchases),
                        score: item.score,
                    }));
            }),

        getRecentActivity: adminProcedure
            .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
            .query(async ({ input }) => {
                const activities = await db
                    .select({
                        id: userAnalytics.id,
                        eventType: userAnalytics.eventType,
                        userId: userAnalytics.userId,
                        productId: userAnalytics.productId,
                        searchQuery: userAnalytics.searchQuery,
                        createdAt: userAnalytics.createdAt,
                        user: user,
                        product: product,
                    })
                    .from(userAnalytics)
                    .leftJoin(user, eq(userAnalytics.userId, user.id))
                    .leftJoin(product, eq(userAnalytics.productId, product.id))
                    .orderBy(desc(userAnalytics.createdAt))
                    .limit(input.limit);

                return activities.map(a => ({
                    id: a.id,
                    eventType: a.eventType,
                    userId: a.userId,
                    userName: a.user?.name || 'مستخدم غير مسجل',
                    userEmail: a.user?.email,
                    productId: a.productId,
                    productName: a.product?.nameAr || a.product?.name,
                    searchQuery: a.searchQuery,
                    createdAt: a.createdAt,
                }));
            }),
    }),
});

