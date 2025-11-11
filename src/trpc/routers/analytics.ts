import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { userAnalytics } from '@/db/schema';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';

export const analyticsRouter = createTRPCRouter({
  trackSearch: baseProcedure
    .input(
      z.object({
        searchQuery: z.string().min(1),
        categoryId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || null;
      const referrer = headersList.get('referer') || null;

      await db.insert(userAnalytics).values({
        id: nanoid(),
        userId: ctx.user?.id ?? null,
        sessionId: null,
        eventType: 'search',
        productId: null,
        categoryId: input.categoryId || null,
        searchQuery: input.searchQuery,
        metadata: {},
        ipAddress: ctx.ipAddress ?? null,
        userAgent,
        referrer,
        createdAt: new Date(),
      });

      return { success: true };
    }),
});

