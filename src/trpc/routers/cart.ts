import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { cart, product, randomBox } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const cartRouter = createTRPCRouter({
    getItems: baseProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            const items = await db
                .select()
                .from(cart)
                .where(eq(cart.userId, input.userId))
                .orderBy(desc(cart.createdAt));

            const enrichedItems = await Promise.all(
                items.map(async (item) => {
                    if (item.itemType === 'product' && item.productId) {
                        const [productData] = await db
                            .select()
                            .from(product)
                            .where(eq(product.id, item.productId))
                            .limit(1);
                        return { ...item, productData };
                    } else if (item.itemType === 'random_box' && item.randomBoxId) {
                        const [boxData] = await db
                            .select()
                            .from(randomBox)
                            .where(eq(randomBox.id, item.randomBoxId))
                            .limit(1);
                        return { ...item, randomBoxData: boxData };
                    }
                    return item;
                })
            );

            return enrichedItems;
        }),

    addRandomBox: baseProcedure
        .input(
            z.object({
                userId: z.string(),
                randomBoxId: z.string().optional(),
                amount: z.string(),
                isCustom: z.boolean().default(false),
            })
        )
        .mutation(async ({ input }) => {
            const cartId = nanoid();
            
            const newItem = await db
                .insert(cart)
                .values({
                    id: cartId,
                    userId: input.userId,
                    randomBoxId: input.randomBoxId || null,
                    productId: null,
                    itemType: 'random_box',
                    quantity: 1,
                    price: input.amount,
                    customAmount: input.isCustom ? input.amount : null,
                    metadata: {
                        isCustom: input.isCustom,
                        addedAt: new Date().toISOString(),
                    },
                })
                .returning();

            return newItem[0];
        }),

    removeItem: baseProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await db.delete(cart).where(eq(cart.id, input.id));
            return { success: true };
        }),

    updateQuantity: baseProcedure
        .input(
            z.object({
                id: z.string(),
                quantity: z.number().min(1),
            })
        )
        .mutation(async ({ input }) => {
            const updated = await db
                .update(cart)
                .set({ quantity: input.quantity })
                .where(eq(cart.id, input.id))
                .returning();

            return updated[0];
        }),

    clear: baseProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ input }) => {
            await db.delete(cart).where(eq(cart.userId, input.userId));
            return { success: true };
        }),
});

