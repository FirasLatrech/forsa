import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { favorite, product } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const favoritesRouter = createTRPCRouter({
  getAll: baseProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const favorites = await db
        .select()
        .from(favorite)
        .leftJoin(product, eq(favorite.productId, product.id))
        .where(eq(favorite.userId, input.userId));

      return favorites.map(item => ({
        id: item.favorites.id,
        productId: item.favorites.productId,
        createdAt: item.favorites.createdAt,
        product: item.products,
      }));
    }),

  check: baseProcedure
    .input(z.object({ userId: z.string(), productIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (input.productIds.length === 0) {
        return {};
      }

      const favorites = await db
        .select()
        .from(favorite)
        .where(eq(favorite.userId, input.userId));

      const favoriteMap: Record<string, boolean> = {};
      favorites.forEach(fav => {
        favoriteMap[fav.productId] = true;
      });

      return favoriteMap;
    }),

  toggle: baseProcedure
    .input(z.object({ userId: z.string(), productId: z.string() }))
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(favorite)
        .where(
          and(
            eq(favorite.userId, input.userId),
            eq(favorite.productId, input.productId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .delete(favorite)
          .where(eq(favorite.id, existing.id));
        
        return { action: 'removed' as const, isFavorite: false };
      } else {
        const { nanoid } = await import('nanoid');
        await db.insert(favorite).values({
          id: nanoid(),
          userId: input.userId,
          productId: input.productId,
        });

        return { action: 'added' as const, isFavorite: true };
      }
    }),
});

