import { z } from 'zod';
import { protectedProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { order, orderItem, cart, randomBoxOrder, product } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const ordersRouter = createTRPCRouter({
    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.auth.user.id;

        const [regularOrders, randomBoxOrders] = await Promise.all([
            db
                .select()
                .from(order)
                .where(eq(order.userId, userId))
                .orderBy(desc(order.createdAt)),
            db
                .select()
                .from(randomBoxOrder)
                .where(eq(randomBoxOrder.userId, userId))
                .orderBy(desc(randomBoxOrder.createdAt)),
        ]);

        return {
            regularOrders,
            randomBoxOrders,
        };
    }),

    create: protectedProcedure
        .input(
            z.object({
                shippingName: z.string().min(1),
                shippingPhone: z.string().min(1),
                shippingAddress: z.string().min(1),
                shippingCity: z.string().min(1),
                notes: z.string().optional(),
                paymentMethod: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.auth.user.id;

            const cartItems = await db
                .select()
                .from(cart)
                .where(and(
                    eq(cart.userId, userId),
                    eq(cart.itemType, 'product')
                ));

            if (cartItems.length === 0) {
                throw new Error('Cart is empty');
            }

            const subtotal = cartItems.reduce((sum, item) => {
                const itemPrice = item.customAmount ? parseFloat(item.customAmount) : parseFloat(item.price);
                return sum + (itemPrice * item.quantity);
            }, 0);

            const shippingCost = subtotal >= 50 ? 0 : 5;
            const tax = 0;
            const discount = 0;
            const total = subtotal + shippingCost + tax - discount;

            const orderNumber = `ORD-${Date.now()}-${nanoid(6).toUpperCase()}`;
            const orderId = nanoid();

            const [newOrder] = await db
                .insert(order)
                .values({
                    id: orderId,
                    orderNumber,
                    userId,
                    status: 'pending',
                    subtotal: subtotal.toString(),
                    shippingCost: shippingCost.toString(),
                    tax: tax.toString(),
                    discount: discount.toString(),
                    total: total.toString(),
                    shippingName: input.shippingName,
                    shippingPhone: input.shippingPhone,
                    shippingAddress: input.shippingAddress,
                    shippingCity: input.shippingCity,
                    notes: input.notes || null,
                    paymentMethod: input.paymentMethod || null,
                    paymentStatus: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            for (const cartItem of cartItems) {
                if (cartItem.productId) {
                    const [productData] = await db
                        .select()
                        .from(product)
                        .where(eq(product.id, cartItem.productId))
                        .limit(1);

                    if (productData) {
                        await db.insert(orderItem).values({
                            id: nanoid(),
                            orderId: orderId,
                            productId: cartItem.productId,
                            productName: productData.name,
                            productNameAr: productData.nameAr,
                            productImage: productData.images?.[0] || null,
                            quantity: cartItem.quantity,
                            price: cartItem.price,
                            total: (parseFloat(cartItem.price) * cartItem.quantity).toString(),
                            createdAt: new Date(),
                        });
                    }
                }
            }

            await db.delete(cart).where(
                and(
                    eq(cart.userId, userId),
                    eq(cart.itemType, 'product')
                )
            );

            return newOrder;
        }),

    createRandomBoxOrder: protectedProcedure
        .input(
            z.object({
                randomBoxId: z.string().optional(),
                customAmount: z.string().optional(),
                shippingName: z.string().min(1),
                shippingPhone: z.string().min(1),
                shippingAddress: z.string().min(1),
                shippingCity: z.string().min(1),
                notes: z.string().optional(),
                paymentMethod: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.auth.user.id;

            const cartItems = await db
                .select()
                .from(cart)
                .where(and(
                    eq(cart.userId, userId),
                    eq(cart.itemType, 'random_box')
                ));

            if (cartItems.length === 0) {
                throw new Error('No random boxes in cart');
            }

            for (const cartItem of cartItems) {
                const amount = cartItem.customAmount ? parseFloat(cartItem.customAmount) : parseFloat(cartItem.price);
                const isCustomAmount = cartItem.customAmount !== null;

                await db.insert(randomBoxOrder).values({
                    id: nanoid(),
                    userId,
                    randomBoxId: cartItem.randomBoxId || null,
                    amount: amount.toString(),
                    isCustomAmount,
                    status: 'pending',
                    shippingName: input.shippingName,
                    shippingPhone: input.shippingPhone,
                    shippingAddress: input.shippingAddress,
                    shippingCity: input.shippingCity,
                    notes: input.notes || null,
                    metadata: input.paymentMethod ? { paymentMethod: input.paymentMethod } : null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            await db.delete(cart).where(
                and(
                    eq(cart.userId, userId),
                    eq(cart.itemType, 'random_box')
                )
            );

            return { success: true };
        }),
});

