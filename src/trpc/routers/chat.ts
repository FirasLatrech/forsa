import { z } from 'zod';
import { baseProcedure, protectedProcedure, createTRPCRouter } from '../init';
import { db } from '@/db';
import { chatMessage, chatSession, chatReadStatus, user } from '@/db/schema';
import { eq, desc, asc, and, or, gt, inArray, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';

export const chatRouter = createTRPCRouter({
  sendMessage: baseProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const messageId = nanoid();
      
      await db.insert(chatMessage).values({
        id: messageId,
        userId: ctx.user?.id ?? null,
        sessionId: input.sessionId,
        message: input.message,
        ipAddress: ctx.ipAddress ?? null,
        isAdmin: false,
      });

      return { success: true, id: messageId };
    }),

  getMessages: baseProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const [messages, userReadStatus, adminReadStatus] = await Promise.all([
        db
          .select({
            id: chatMessage.id,
            message: chatMessage.message,
            isAdmin: chatMessage.isAdmin,
            createdAt: chatMessage.createdAt,
            userId: chatMessage.userId,
          })
          .from(chatMessage)
          .where(eq(chatMessage.sessionId, input.sessionId))
          .orderBy(asc(chatMessage.createdAt))
          .limit(50),
        ctx.user?.id
          ? db
              .select()
              .from(chatReadStatus)
              .where(
                and(
                  eq(chatReadStatus.sessionId, input.sessionId),
                  eq(chatReadStatus.userId, ctx.user.id),
                  eq(chatReadStatus.isAdmin, false)
                )
              )
              .limit(1)
          : Promise.resolve([]),
        db
          .select()
          .from(chatReadStatus)
          .where(
            and(
              eq(chatReadStatus.sessionId, input.sessionId),
              eq(chatReadStatus.isAdmin, true)
            )
          )
          .limit(1),
      ]);

      const lastReadTime = userReadStatus[0]?.lastReadAt?.getTime() || 0;
      const adminLastReadTime = adminReadStatus[0]?.lastReadAt?.getTime() || 0;

      return messages.map((msg) => {
        const msgTime = msg.createdAt.getTime();
        return {
          ...msg,
          isRead: msg.isAdmin 
            ? msgTime <= lastReadTime
            : msgTime <= adminLastReadTime,
        };
      });
    }),

  adminGetAllMessages: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        showCompleted: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth?.user?.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const offset = (input.page - 1) * input.pageSize;

      const messages = await db
        .select({
          id: chatMessage.id,
          message: chatMessage.message,
          isAdmin: chatMessage.isAdmin,
          createdAt: chatMessage.createdAt,
          sessionId: chatMessage.sessionId,
          ipAddress: chatMessage.ipAddress,
          userId: chatMessage.userId,
          userName: user.name,
          userEmail: user.email,
        })
        .from(chatMessage)
        .leftJoin(user, eq(chatMessage.userId, user.id))
        .orderBy(desc(chatMessage.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const uniqueSessions = await db
        .selectDistinct({ sessionId: chatMessage.sessionId })
        .from(chatMessage)
        .where(eq(chatMessage.isAdmin, false));

      const sessionStatuses = await db
        .select({
          sessionId: chatSession.sessionId,
          isCompleted: chatSession.isCompleted,
          completedAt: chatSession.completedAt,
        })
        .from(chatSession);

      const statusMap: Record<string, { isCompleted: boolean; completedAt: Date | null }> = {};
      sessionStatuses.forEach((s) => {
        statusMap[s.sessionId] = {
          isCompleted: s.isCompleted,
          completedAt: s.completedAt,
        };
      });

      const readStatuses = await db
        .select()
        .from(chatReadStatus)
        .where(
          and(
            eq(chatReadStatus.userId, ctx.auth.user.id),
            eq(chatReadStatus.isAdmin, true)
          )
        );

      const unreadMap: Record<string, boolean> = {};
      const sessionIds = uniqueSessions.map((s) => s.sessionId);

      for (const sessionId of sessionIds) {
        const lastRead = readStatuses.find((r) => r.sessionId === sessionId);
        const lastReadTime = lastRead?.lastReadAt || new Date(0);

        const unreadMessages = await db
          .select({ id: chatMessage.id })
          .from(chatMessage)
          .where(
            and(
              eq(chatMessage.sessionId, sessionId),
              eq(chatMessage.isAdmin, false),
              gt(chatMessage.createdAt, lastReadTime)
            )
          )
          .limit(1);

        unreadMap[sessionId] = unreadMessages.length > 0;
      }

      return {
        messages: messages.reverse(),
        totalSessions: uniqueSessions.length,
        sessionStatuses: statusMap,
        unreadStatuses: unreadMap,
      };
    }),

  adminGetSessionMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth?.user?.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const messages = await db
        .select({
          id: chatMessage.id,
          message: chatMessage.message,
          isAdmin: chatMessage.isAdmin,
          createdAt: chatMessage.createdAt,
          userId: chatMessage.userId,
          userName: user.name,
          userEmail: user.email,
          ipAddress: chatMessage.ipAddress,
        })
        .from(chatMessage)
        .leftJoin(user, eq(chatMessage.userId, user.id))
        .where(eq(chatMessage.sessionId, input.sessionId))
        .orderBy(desc(chatMessage.createdAt))
        .limit(100);

      let adminLastReadTime = new Date(0);
      const existingRead = await db
        .select()
        .from(chatReadStatus)
        .where(
          and(
            eq(chatReadStatus.sessionId, input.sessionId),
            eq(chatReadStatus.userId, ctx.auth.user.id),
            eq(chatReadStatus.isAdmin, true)
          )
        )
        .limit(1);

      if (existingRead.length > 0) {
        adminLastReadTime = existingRead[0].lastReadAt;
        await db
          .update(chatReadStatus)
          .set({
            lastReadAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatReadStatus.id, existingRead[0].id));
      } else {
        const readStatusId = nanoid();
        await db.insert(chatReadStatus).values({
          id: readStatusId,
          sessionId: input.sessionId,
          userId: ctx.auth.user.id,
          isAdmin: true,
          lastReadAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        adminLastReadTime = new Date();
      }

      const userReadStatus = await db
        .select()
        .from(chatReadStatus)
        .where(
          and(
            eq(chatReadStatus.sessionId, input.sessionId),
            eq(chatReadStatus.isAdmin, false)
          )
        )
        .limit(1);

      const userLastReadTime = userReadStatus[0]?.lastReadAt || new Date(0);

      return messages.reverse().map((msg) => ({
        ...msg,
        isRead: msg.isAdmin
          ? new Date(msg.createdAt) <= userLastReadTime
          : new Date(msg.createdAt) <= adminLastReadTime,
      }));
    }),

  adminSendReply: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth?.user?.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const messageId = nanoid();

      await db.insert(chatMessage).values({
        id: messageId,
        userId: ctx.auth.user.id,
        sessionId: input.sessionId,
        message: input.message,
        ipAddress: ctx.ipAddress ?? null,
        isAdmin: true,
      });

      return { success: true, id: messageId };
    }),

  adminMarkSessionCompleted: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth?.user?.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const existingSession = await db
        .select()
        .from(chatSession)
        .where(eq(chatSession.sessionId, input.sessionId))
        .limit(1);

      if (existingSession.length > 0) {
        await db
          .update(chatSession)
          .set({
            isCompleted: input.completed,
            completedAt: input.completed ? new Date() : null,
            completedBy: input.completed ? ctx.auth.user.id : null,
            updatedAt: new Date(),
          })
          .where(eq(chatSession.sessionId, input.sessionId));
      } else {
        const sessionId = nanoid();
        await db.insert(chatSession).values({
          id: sessionId,
          sessionId: input.sessionId,
          userId: null,
          isCompleted: input.completed,
          completedAt: input.completed ? new Date() : null,
          completedBy: input.completed ? ctx.auth.user.id : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    }),

  adminGetSessionStatus: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth?.user?.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const [session] = await db
        .select()
        .from(chatSession)
        .where(eq(chatSession.sessionId, input.sessionId))
        .limit(1);

      return {
        isCompleted: session?.isCompleted ?? false,
        completedAt: session?.completedAt ?? null,
      };
    }),

  markAsRead: baseProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) return { success: false };

      const existingRead = await db
        .select()
        .from(chatReadStatus)
        .where(
          and(
            eq(chatReadStatus.sessionId, input.sessionId),
            eq(chatReadStatus.userId, ctx.user.id),
            eq(chatReadStatus.isAdmin, false)
          )
        )
        .limit(1);

      if (existingRead.length > 0) {
        await db
          .update(chatReadStatus)
          .set({
            lastReadAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatReadStatus.id, existingRead[0].id));
      } else {
        const readStatusId = nanoid();
        await db.insert(chatReadStatus).values({
          id: readStatusId,
          sessionId: input.sessionId,
          userId: ctx.user.id,
          isAdmin: false,
          lastReadAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    }),

  getUnreadCount: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) return { count: 0 };

    const userSessions = await db
      .selectDistinct({ sessionId: chatMessage.sessionId })
      .from(chatMessage)
      .where(eq(chatMessage.userId, ctx.user.id));

    if (userSessions.length === 0) return { count: 0 };

    const sessionIds = userSessions.map((s) => s.sessionId);
    
    const readStatus = await db
      .select()
      .from(chatReadStatus)
      .where(
        and(
          inArray(chatReadStatus.sessionId, sessionIds),
          eq(chatReadStatus.userId, ctx.user.id),
          eq(chatReadStatus.isAdmin, false)
        )
      );

    const readMap = new Map(readStatus.map((r) => [r.sessionId, r.lastReadAt]));

    const latestAdminMessages = await db
      .select({
        sessionId: chatMessage.sessionId,
        maxCreatedAt: sql<Date>`MAX(${chatMessage.createdAt})`.as('max_created_at'),
      })
      .from(chatMessage)
      .where(
        and(
          inArray(chatMessage.sessionId, sessionIds),
          eq(chatMessage.isAdmin, true)
        )
      )
      .groupBy(chatMessage.sessionId);

    let unreadCount = 0;
    for (const msg of latestAdminMessages) {
      const lastReadTime = readMap.get(msg.sessionId) || new Date(0);
      if (new Date(msg.maxCreatedAt) > lastReadTime) {
        unreadCount++;
      }
    }

    return { count: unreadCount };
  }),

  adminMarkAsRead: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth?.user?.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const existingRead = await db
        .select()
        .from(chatReadStatus)
        .where(
          and(
            eq(chatReadStatus.sessionId, input.sessionId),
            eq(chatReadStatus.userId, ctx.auth.user.id),
            eq(chatReadStatus.isAdmin, true)
          )
        )
        .limit(1);

      if (existingRead.length > 0) {
        await db
          .update(chatReadStatus)
          .set({
            lastReadAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chatReadStatus.id, existingRead[0].id));
      } else {
        const readStatusId = nanoid();
        await db.insert(chatReadStatus).values({
          id: readStatusId,
          sessionId: input.sessionId,
          userId: ctx.auth.user.id,
          isAdmin: true,
          lastReadAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    }),

  adminGetUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth?.user?.isAdmin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    const allSessions = await db
      .selectDistinct({ sessionId: chatMessage.sessionId })
      .from(chatMessage)
      .where(eq(chatMessage.isAdmin, false));

    if (allSessions.length === 0) return { count: 0 };

    const sessionIds = allSessions.map((s) => s.sessionId);
    const readStatus = await db
      .select()
      .from(chatReadStatus)
      .where(
        and(
          eq(chatReadStatus.userId, ctx.auth.user.id),
          eq(chatReadStatus.isAdmin, true)
        )
      );

    const readMap = new Map(readStatus.map((r) => [r.sessionId, r.lastReadAt]));

    let unreadCount = 0;
    for (const sessionId of sessionIds) {
      const lastReadTime = readMap.get(sessionId) || new Date(0);
      const unreadMessages = await db
        .select({ id: chatMessage.id })
        .from(chatMessage)
        .where(
          and(
            eq(chatMessage.sessionId, sessionId),
            eq(chatMessage.isAdmin, false),
            gt(chatMessage.createdAt, lastReadTime)
          )
        )
        .limit(1);

      if (unreadMessages.length > 0) {
        unreadCount++;
      }
    }

    return { count: unreadCount };
  }),
});

