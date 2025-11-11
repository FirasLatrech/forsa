import { createTRPCRouter } from '../init';
import { productsRouter } from "./products";
import { categoriesRouter } from "./categories";
import { randomBoxesRouter } from "./random-boxes";
import { cartRouter } from "./cart";
import { favoritesRouter } from "./favorites";
import { adminRouter } from "@/modules/dashboard/server/procedures";
import { chatRouter } from "./chat";
import { ordersRouter } from "./orders";
import { preferencesRouter } from "./preferences";
import { analyticsRouter } from "./analytics";

export const appRouter = createTRPCRouter({
    products: productsRouter,
    categories: categoriesRouter,
    randomBoxes: randomBoxesRouter,
    cart: cartRouter,
    favorites: favoritesRouter,
    admin: adminRouter,
    chat: chatRouter,
    orders: ordersRouter,
    preferences: preferencesRouter,
    analytics: analyticsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
