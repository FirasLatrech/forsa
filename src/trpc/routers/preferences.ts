import { z } from 'zod';
import { protectedProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { userPreference } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const preferencesRouter = createTRPCRouter({
  getShopFilters: protectedProcedure.query(async ({ ctx }) => {
    const [prefs] = await db
      .select()
      .from(userPreference)
      .where(eq(userPreference.userId, ctx.auth.user.id))
      .limit(1);

    if (!prefs || !prefs.metadata?.shopFilters) {
      return null;
    }

    return prefs.metadata.shopFilters as {
      search?: string;
      categoryId?: string;
      sortBy?: string;
    };
  }),

  saveShopFilters: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        sortBy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import('nanoid');
      
      const [existing] = await db
        .select()
        .from(userPreference)
        .where(eq(userPreference.userId, ctx.auth.user.id))
        .limit(1);

      const shopFilters = {
        search: input.search || '',
        categoryId: input.categoryId || '',
        sortBy: input.sortBy || 'newest',
      };

      if (existing) {
        await db
          .update(userPreference)
          .set({
            metadata: {
              ...existing.metadata,
              shopFilters,
            },
            updatedAt: new Date(),
          })
          .where(eq(userPreference.id, existing.id));
      } else {
        await db.insert(userPreference).values({
          id: nanoid(),
          userId: ctx.auth.user.id,
          metadata: {
            shopFilters,
          },
        });
      }

      return { success: true };
    }),
});

