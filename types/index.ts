/**
 * Plain data shapes handed to components.
 *
 * Nothing under `components/` imports a Prisma type. Server code maps rows into
 * these DTOs first, which keeps the UI layer independent of the database and
 * makes it trivial to swap in fixtures while building.
 *
 * All money fields are integer agorot (1 shekel = 100 agorot).
 */

export type ImageDTO = {
  /** Route through our own image handler, e.g. `/api/images/pizza.webp`. */
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type SpecialDTO = {
  id: string;
  offerPrice: number;
  label: string | null;
  /** ISO date, for the "ends soon" hint in the admin list. */
  expiresAt: string | null;
};

export type DishDTO = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Menu price in agorot. */
  price: number;
  /** Price to actually charge right now — the special if one is live. */
  currentPrice: number;
  special: SpecialDTO | null;
  available: boolean;
  featured: boolean;
  /** Position within the category. Lower comes first. */
  sortOrder: number;
  categoryId: string;
  categoryName: string;
  image: ImageDTO | null;
};

export type CategoryDTO = {
  id: string;
  name: string;
  /** Only counts dishes a customer can actually order. */
  dishCount: number;
};

export type CartLineDTO = {
  dishId: string;
  slug: string;
  name: string;
  image: ImageDTO | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderDTO = {
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
  createdAt: string;
  items: {
    id: string;
    dishId: string | null;
    dishName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

export type AnnouncementDTO = {
  id: string;
  body: string;
  /** Admin needs this to render the toggle; the storefront only reads live ones. */
  active: boolean;
};

/** Field-level errors returned from a server action. */
export type FieldErrors = Record<string, string>;

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: FieldErrors;
};