"use server";

import { db } from '@/db';
import { favorite } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function toggleFavorite(params: {
  userId: string;
  productId: string;
}) {
  try {
    const [existing] = await db
      .select()
      .from(favorite)
      .where(
        and(
          eq(favorite.userId, params.userId),
          eq(favorite.productId, params.productId)
        )
      )
      .limit(1);

    if (existing) {
      await db.delete(favorite).where(eq(favorite.id, existing.id));
      return { success: true, action: 'removed', isFavorite: false };
    } else {
      await db.insert(favorite).values({
        id: nanoid(),
        userId: params.userId,
        productId: params.productId,
      });
      return { success: true, action: 'added', isFavorite: true };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, error: 'Failed to update favorite' };
  }
}

