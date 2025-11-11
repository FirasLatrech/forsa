import { pgTable, text, timestamp, boolean, pgEnum, integer, decimal, jsonb, index } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const eventTypeEnum = pgEnum('event_type', ['view_product', 'add_to_cart', 'remove_from_cart', 'add_to_favorites', 'remove_from_favorites', 'purchase', 'search']);

export const user = pgTable("users", {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
    image: text('image'),
    phone: text('phone'),
    address: text('address'),
    city: text('city'),
    isAdmin: boolean('is_admin').$defaultFn(() => false).notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date())
});

export const category = pgTable("categories", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    parentId: text('parent_id').references((): any => category.id, { onDelete: 'set null' }),
    displayOrder: integer('display_order').$defaultFn(() => 0),
    isActive: boolean('is_active').$defaultFn(() => true).notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const product = pgTable("products", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    descriptionAr: text('description_ar'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
    sku: text('sku').unique(),
    barcode: text('barcode'),
    stock: integer('stock').$defaultFn(() => 0).notNull(),
    lowStockThreshold: integer('low_stock_threshold').$defaultFn(() => 5),
    weight: decimal('weight', { precision: 8, scale: 2 }),
    images: jsonb('images').$type<string[]>(),
    categoryId: text('category_id').references(() => category.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').$defaultFn(() => true).notNull(),
    isFeatured: boolean('is_featured').$defaultFn(() => false).notNull(),
    isNew: boolean('is_new').$defaultFn(() => false).notNull(),
    viewCount: integer('view_count').$defaultFn(() => 0).notNull(),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const favorite = pgTable("favorites", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
});

export const cart = pgTable("carts", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => product.id, { onDelete: 'cascade' }),
    randomBoxId: text('random_box_id').references(() => randomBox.id, { onDelete: 'cascade' }),
    itemType: text('item_type').notNull().$type<'product' | 'random_box'>(),
    quantity: integer('quantity').$defaultFn(() => 1).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    customAmount: decimal('custom_amount', { precision: 10, scale: 2 }),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const order = pgTable("orders", {
    id: text('id').primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    status: orderStatusEnum('status').$defaultFn(() => 'pending').notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).$defaultFn(() => '0').notNull(),
    tax: decimal('tax', { precision: 10, scale: 2 }).$defaultFn(() => '0').notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).$defaultFn(() => '0').notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    shippingName: text('shipping_name').notNull(),
    shippingPhone: text('shipping_phone').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    shippingCity: text('shipping_city').notNull(),
    notes: text('notes'),
    paymentMethod: text('payment_method'),
    paymentStatus: text('payment_status').$defaultFn(() => 'pending'),
    trackingNumber: text('tracking_number'),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
    completedAt: timestamp('completed_at')
});

export const orderItem = pgTable("order_items", {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull().references(() => product.id, { onDelete: 'restrict' }),
    productName: text('product_name').notNull(),
    productNameAr: text('product_name_ar').notNull(),
    productImage: text('product_image'),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
});

export const userAnalytics = pgTable("user_analytics", {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    eventType: eventTypeEnum('event_type').notNull(),
    productId: text('product_id').references(() => product.id, { onDelete: 'set null' }),
    categoryId: text('category_id').references(() => category.id, { onDelete: 'set null' }),
    searchQuery: text('search_query'),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
});

export const userPreference = pgTable("user_preferences", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    favoriteCategories: jsonb('favorite_categories').$type<string[]>(),
    viewedProducts: jsonb('viewed_products').$type<string[]>(),
    searchHistory: jsonb('search_history').$type<string[]>(),
    preferredPriceRange: jsonb('preferred_price_range').$type<{ min: number; max: number }>(),
    language: text('language').$defaultFn(() => 'ar'),
    emailNotifications: boolean('email_notifications').$defaultFn(() => true),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const review = pgTable("reviews", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
    orderId: text('order_id').references(() => order.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    isVerifiedPurchase: boolean('is_verified_purchase').$defaultFn(() => false),
    isPublished: boolean('is_published').$defaultFn(() => true),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const randomBox = pgTable("random_boxes", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar').notNull(),
    description: text('description'),
    descriptionAr: text('description_ar'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    minValue: decimal('min_value', { precision: 10, scale: 2 }).notNull(),
    maxValue: decimal('max_value', { precision: 10, scale: 2 }),
    colorGradient: text('color_gradient').notNull(),
    icon: text('icon').notNull(),
    displayOrder: integer('display_order').$defaultFn(() => 0),
    isActive: boolean('is_active').$defaultFn(() => true).notNull(),
    stock: integer('stock').$defaultFn(() => 0),
    soldCount: integer('sold_count').$defaultFn(() => 0).notNull(),
    productIds: jsonb('product_ids').$type<string[]>(),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const randomBoxOrder = pgTable("random_box_orders", {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	randomBoxId: text('random_box_id').references(() => randomBox.id, { onDelete: 'set null' }),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	isCustomAmount: boolean('is_custom_amount').$defaultFn(() => false).notNull(),
	revealedProducts: jsonb('revealed_products').$type<string[]>(),
	status: orderStatusEnum('status').$defaultFn(() => 'pending').notNull(),
	shippingName: text('shipping_name').notNull(),
	shippingPhone: text('shipping_phone').notNull(),
	shippingAddress: text('shipping_address').notNull(),
	shippingCity: text('shipping_city').notNull(),
	notes: text('notes'),
	metadata: jsonb('metadata').$type<Record<string, any>>(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
	revealedAt: timestamp('revealed_at')
});

export const chatMessage = pgTable("chat_messages", {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
	sessionId: text('session_id').notNull(),
	message: text('message').notNull(),
	ipAddress: text('ip_address'),
	isAdmin: boolean('is_admin').$defaultFn(() => false).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
}, (table) => ({
	sessionIdIdx: index('chat_messages_session_id_idx').on(table.sessionId),
	createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
	sessionIdCreatedAtIdx: index('chat_messages_session_id_created_at_idx').on(table.sessionId, table.createdAt),
	userIdIdx: index('chat_messages_user_id_idx').on(table.userId),
}));

export const chatSession = pgTable("chat_sessions", {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull().unique(),
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
	isCompleted: boolean('is_completed').$defaultFn(() => false).notNull(),
	completedAt: timestamp('completed_at'),
	completedBy: text('completed_by').references(() => user.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const chatReadStatus = pgTable("chat_read_status", {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	isAdmin: boolean('is_admin').$defaultFn(() => false).notNull(),
	lastReadAt: timestamp('last_read_at').$defaultFn(() => new Date()).notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
	updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
}, (table) => ({
	sessionIdIdx: index('chat_read_status_session_id_idx').on(table.sessionId),
	userIdIdx: index('chat_read_status_user_id_idx').on(table.userId),
	sessionUserAdminIdx: index('chat_read_status_session_user_admin_idx').on(table.sessionId, table.userId, table.isAdmin),
}));

