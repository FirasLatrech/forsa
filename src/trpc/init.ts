import { auth } from '@/lib/auth';
import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { cache } from 'react';
import superjson from 'superjson';

function getClientIP(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return null;
}

export const createTRPCContext = cache(async () => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  
  return {
    user: session?.user ?? null,
    session: session ?? null,
    ipAddress: getClientIP(headersList),
  };
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ctx, next}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new TRPCError({code: 'UNAUTHORIZED' ,message: 'Unauthorized'});
  }
  return next({ctx: {...ctx ,auth: session}});
});
