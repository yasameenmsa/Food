/**
 * Order writes and reads, mapped to DTOs.
 */
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
 * the phone. Falls back to a timestamp if the random suffix ever collides.
 */
async function nextReference(): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let suffix = "";
    for (let i = 0; i < 4; i += 1) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const reference = `ZAY-${suffix}`;
    const clash = await prisma.order.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!clash) return reference;
  }
  return `ZAY-${Date.now().toString(36).toUpperCase().slice(-5)}`;
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
      items: {
        create: input.lines.map((line) => ({
          dishId: line.dishId,
          dishName: line.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
      },
    },
    include: orderInclude,
  });

  return toOrderDTO(row);
}

export async function getOrderByReference(reference: string): Promise<OrderDTO | null> {
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

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await prisma.order.update({ where: { id }, data: { status } });
}

export async function markWhatsappSent(id: string): Promise<void> {
  await prisma.order.update({ where: { id }, data: { whatsappSent: true } });
}

export { ORDER_STATUS_META, ORDER_STATUS_VALUES } from "./order-status";