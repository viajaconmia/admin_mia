// CLIENTES
export interface Client {
  id: number;
  name: string;
  email: string;
}

export interface InsertClient {
  name: string;
  email: string;
}

// RESERVAS
export type ReservationType = "hotel" | "flight" | "car" | "bus";
export type ReservationStatus = "active" | "completed" | "cancelled";

export interface Reservation {
  id: number;
  clientId: number;
  type: ReservationType;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  totalAmount: number;
  status: ReservationStatus;
}

export interface InsertReservation {
  clientId: number;
  type: ReservationType;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  totalAmount: number;
  status?: ReservationStatus;
}

// ÍTEMS DE RESERVA
export type ReservationItemStatus = "pending" | "billed" | "paid";

export interface ReservationItem {
  id: number;
  reservationId: number;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: ReservationItemStatus;
}

export interface InsertReservationItem {
  reservationId: number;
  name: string;
  description?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  status?: ReservationItemStatus;
}

// FACTURAS
export type InvoiceStatus = "pending" | "paid" | "cancelled";

export interface Invoice {
  id: number;
  clientId: number;
  invoiceNumber: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  items: any[]; // Puedes definir un tipo más detallado según lo que contiene "items"
}

export interface InsertInvoice {
  clientId: number;
  invoiceNumber: string;
  totalAmount: number;
  status?: InvoiceStatus;
  items: any[]; // igual que arriba
}

// PAGOS ANTICIPADOS (PREPAYMENTS)
export type PrepaymentStatus = "pending" | "confirmed" | "applied";
export type PaymentMethod = "spei" | "stripe" | "stripe_manual";

export interface Prepayment {
  id: number;
  clientId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PrepaymentStatus;
  paymentDate?: string;
  reference?: string;
  comments?: string;
  stripePaymentUrl?: string;
  stripeChargeId?: string;
  stripeTransactionId?: string;
  manualProcessingNotes?: string;
  remainingBalance: number;
  createdAt: string;
}

export interface InsertPrepayment {
  clientId: number;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  status?: PrepaymentStatus;
  paymentDate?: string;
  reference?: string;
  comments?: string;
  stripePaymentUrl?: string;
  stripeChargeId?: string;
  stripeTransactionId?: string;
  manualProcessingNotes?: string;
  remainingBalance: number;
}

// TIPOS COMPUESTOS

export interface ReservationWithItems extends Reservation {
  items: ReservationItem[];
}

export interface ClientSummary extends Client {
  totalReserved: number;
  totalBilled: number;
  totalPending: number;
  activeReservations: number;
}

/*import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  type: text("type").notNull(), // 'hotel', 'flight', 'car', 'bus'
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'cancelled'
});

export const reservationItems = pgTable("reservation_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'billed', 'paid'
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'cancelled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  items: jsonb("items").notNull(), // Array of billed items
});

export const prepayments = pgTable("prepayments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  paymentMethod: text("payment_method").notNull(), // "spei", "stripe", or "stripe_manual"
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "applied"
  paymentDate: text("payment_date"),
  reference: text("reference"),
  comments: text("comments"),
  stripePaymentUrl: text("stripe_payment_url"),
  stripeChargeId: text("stripe_charge_id"),
  stripeTransactionId: text("stripe_transaction_id"),
  manualProcessingNotes: text("manual_processing_notes"),
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
});

export const insertReservationItemSchema = createInsertSchema(reservationItems).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertPrepaymentSchema = createInsertSchema(prepayments).omit({
  id: true,
  createdAt: true,
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type ReservationItem = typeof reservationItems.$inferSelect;
export type InsertReservationItem = z.infer<typeof insertReservationItemSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Prepayment = typeof prepayments.$inferSelect;
export type InsertPrepayment = z.infer<typeof insertPrepaymentSchema>;

export interface ReservationWithItems extends Reservation {
  items: ReservationItem[];
}

export interface ClientSummary extends Client {
  totalReserved: number;
  totalBilled: number;
  totalPending: number;
  activeReservations: number;
}
*/
