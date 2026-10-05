/**
 * Order writes and reads, mapped to DTOs.
 */
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { CartLineDTO, OrderDTO, OrderStatus } from "@/types";
import { ORDER_STATUS_META, ORDER_STATUS_VALUES } from "./order-status";

const orderInclude = { items: { orderBy: { id: "asc" } } } as const;

type OrderRow = {
  id: string;
  reference: string;
  type: "DELIVERY" | "PICKUP";
  status: OrderStatus;
  customerName: string;
  phone: string;
  address: string | null;
  notes: string | null;
  subtotal: number;
  fee: number;
  total: number;
  whatsappSent: boolean;
  createdAt: Date;
  items: {
    id: string;
    dishId: string | null;
    dishName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

function toOrderDTO(row: OrderRow): OrderDTO {
  return {
    id: row.id,
    reference: row.reference,
    type: row.type,
    status: row.status,
    customerName: row.customerName,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    subtotal: row.subtotal,
    fee: row.fee,
    total: row.total,
    whatsappSent: row.whatsappSent,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      dishId: item.dishId,
      dishName: item.dishName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };
}

/**
 * Short, human-quotable reference. Not a UUID — the owner reads these aloud on
 * the phone.
 *
 * The previous version generated a 4-character candidate and then looked for a
 * clash before writing, which races: two concurrent orders can both see a free
 * reference and the loser fails on the `unique` constraint. Instead we use
 * `crypto.randomInt`, and on a collision we simply generate again — the unique
 * constraint becomes the check rather than a SELECT.
 */
async function nextReference(): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let suffix = "";
    for (let i = 0; i < 5; i += 1) {
      suffix += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    return `ZAY-${suffix}`;
  }
  // Vanishingly unlikely, but never hand back a colliding key.
  return `ZAY-${Date.now().toString(36).toUpperCase()}`;
}

/** True when Prisma rejected the write because a unique index already held it. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function createOrder(input: {
  type: "DELIVERY" | "PICKUP";
  customerName: string;
  phone: string;
  address: string | null;
  notes: string | null;
  lines: CartLineDTO[];
  fee: number;
}): Promise<OrderDTO> {
  const subtotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const items = input.lines.map((line) => ({
    dishId: line.dishId,
    dishName: line.name,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));

  // A reference collision is the only expected failure here, and it is safe to
  // retry because nothing else has happened yet.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const row = await prisma.order.create({
        data: {
          reference: await nextReference(),
          type: input.type,
          status: "PENDING",
          customerName: input.customerName,
          phone: input.phone,
          address: input.address,
          notes: input.notes,
          subtotal,
          fee: input.fee,
          total: subtotal + input.fee,
          whatsappSent: false,
          items: { create: items },
        },
        include: orderInclude,
      });
      return toOrderDTO(row);
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 4) throw error;
    }
  }

  throw new Error("Could not allocate a unique order reference.");
}

export async function getOrderByReference(
  reference: string,
): Promise<OrderDTO | null> {
  const row = await prisma.order.findUnique({
    where: { reference },
    include: orderInclude,
  });
  return row ? toOrderDTO(row) : null;
}

export async function getOrders(status?: OrderStatus): Promise<OrderDTO[]> {
  const rows = await prisma.order.findMany({
    where: status ? { status } : {},
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(toOrderDTO);
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  await prisma.order.update({ where: { id }, data: { status } });
}

export async function markWhatsappSent(id: string): Promise<void> {
  await prisma.order.update({ where: { id }, data: { whatsappSent: true } });
}

export { ORDER_STATUS_META, ORDER_STATUS_VALUES } from "./order-status";
