"use server";

import { db } from '@/db';
import { cart, product } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function addProductToCart(params: {
  userId: string;
  productId: string;
  quantity: number;
}) {
  try {
    const [productData] = await db
      .select()
      .from(product)
      .where(eq(product.id, params.productId))
      .limit(1);

    if (!productData) {
      return { success: false, error: 'Product not found' };
    }

    const [existingItem] = await db
      .select()
      .from(cart)
      .where(
        and(
          eq(cart.userId, params.userId),
          eq(cart.productId, params.productId),
          eq(cart.itemType, 'product')
        )
      )
      .limit(1);

    if (existingItem) {
      const updated = await db
        .update(cart)
        .set({ quantity: existingItem.quantity + params.quantity })
        .where(eq(cart.id, existingItem.id))
        .returning();

      return { success: true, data: updated[0] };
    } else {
      const cartId = nanoid();
      
      const newItem = await db
        .insert(cart)
        .values({
          id: cartId,
          userId: params.userId,
          productId: params.productId,
          randomBoxId: null,
          itemType: 'product',
          quantity: params.quantity,
          price: productData.price,
          customAmount: null,
          metadata: {
            addedAt: new Date().toISOString(),
          },
        })
        .returning();

      return { success: true, data: newItem[0] };
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return { success: false, error: 'Failed to add to cart' };
  }
}

export async function addRandomBoxToCart(params: {
  userId: string;
  randomBoxId?: string;
  amount: string;
  isCustom: boolean;
}) {
  try {
    const cartId = nanoid();
    
    const newItem = await db
      .insert(cart)
      .values({
        id: cartId,
        userId: params.userId,
        randomBoxId: params.randomBoxId || null,
        productId: null,
        itemType: 'random_box',
        quantity: 1,
        price: params.amount,
        customAmount: params.isCustom ? params.amount : null,
        metadata: {
          isCustom: params.isCustom,
          addedAt: new Date().toISOString(),
        },
      })
      .returning();

    return { success: true, data: newItem[0] };
  } catch (error) {
    console.error('Error adding random box to cart:', error);
    return { success: false, error: 'Failed to add to cart' };
  }
}

export async function updateCartItemQuantity(params: { id: string; quantity: number }) {
  try {
    const updated = await db
      .update(cart)
      .set({ quantity: params.quantity })
      .where(eq(cart.id, params.id))
      .returning();

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating quantity:', error);
    return { success: false, error: 'Failed to update quantity' };
  }
}

export async function removeCartItem(id: string) {
  try {
    await db.delete(cart).where(eq(cart.id, id));
    return { success: true };
  } catch (error) {
    console.error('Error removing item:', error);
    return { success: false, error: 'Failed to remove item' };
  }
}
