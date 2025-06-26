import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique, // ✅ Add this
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Platform Schema (for storing platform-specific product details)
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  originalPrice: doublePrecision("original_price"),
  codAvailable: boolean("cod_available").default(false),
  freeDelivery: boolean("free_delivery").default(false),
  deliveryDate: text("delivery_date"),
  returnPolicy: text("return_policy"),
  isBestDeal: boolean("is_best_deal").default(false),
});

export const platformSchema = createInsertSchema(platforms);
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = typeof platforms.$inferInsert;

// Product Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"),
  image: text("image"),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productSchema = createInsertSchema(products);
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Extended Product type that includes platforms
export type ProductWithPlatforms = Product & {
  platforms: Platform[];
};

// Cart Item Schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  productId: integer("product_id").notNull(),
  platformId: text("platform_id").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  productId: true,
  platformId: true,
  quantity: true,
});

export type CartItem = typeof cartItems.$inferSelect & {
  product: ProductWithPlatforms;
};

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Search Filters Schema
export const searchFiltersSchema = z.object({
  category: z.string().optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  brands: z.array(z.string()).optional(),
  deliveryOptions: z
    .object({
      codAvailable: z.boolean().optional(),
      freeDelivery: z.boolean().optional(),
      expressDelivery: z.boolean().optional(),
    })
    .optional(),
  rating: z.number().min(1).max(5).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// Seller Schema
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  storeName: text("store_name").notNull(),
  description: text("description"),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Seller Product Schema
export const sellerProducts = pgTable(
  "seller_products",
  {
    id: serial("id").primaryKey(),
    sellerId: integer("seller_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    price: doublePrecision("price").notNull(),
    stock: integer("stock").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueSellerProduct: unique().on(table.name, table.sellerId),
  })
);

// Order Schema - MOVED BEFORE schema OBJECT
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  status: text("status").notNull(), // pending, confirmed, shipped, delivered
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema object - NOW AFTER all table definitions
export const schema = {
  sellers,
  sellerProducts,
  orders,
};
