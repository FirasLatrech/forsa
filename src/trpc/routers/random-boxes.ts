import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { randomBox } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const randomBoxesRouter = createTRPCRouter({
    getAll: baseProcedure.query(async () => {
        const boxes = await db
            .select()
            .from(randomBox)
            .where(eq(randomBox.isActive, true))
            .orderBy(asc(randomBox.displayOrder));

        return boxes;
    }),

    getById: baseProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const [box] = await db
                .select()
                .from(randomBox)
                .where(eq(randomBox.id, input.id))
                .limit(1);

            if (!box) {
                throw new Error('Random box not found');
            }

            return box;
        }),
});

