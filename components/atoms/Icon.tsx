import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  Minus,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";

/* Brand glyphs are not in lucide (it dropped brand icons), so these three are
   drawn here. All use currentColor, like the rest. */
const WHATSAPP_PATH =
  "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.35-.5.05-.98.23-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.13-.14-.19-1.12-1.49-1.12-2.84 0-1.35.71-2.02.96-2.29.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.16.28.73 1.2 1.56 1.95 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.17-.19.7-.82.89-1.1.19-.28.37-.23.63-.14.25.09 1.65.78 1.94.92.28.14.47.21.54.33.07.11.07.64-.17 1.32z";

const INSTAGRAM_PATH =
  "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.71 2.13-1.38.67-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.71-1.46-1.38-2.13C21.32 1.35 20.65.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A3.99 3.99 0 1 1 16 12a3.99 3.99 0 0 1-4 3.99zm6.41-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z";

const FACEBOOK_PATH =
  "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z";

const TIKTOK_PATH =
  "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.69a5.68 5.68 0 0 0-.77-.05A5.68 5.68 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48z";

const LUCIDE: Record<string, LucideIcon> = {
  alert: AlertCircle,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  clock: Clock,
  copy: Copy,
  external: ExternalLink,
  flame: Flame,
  image: ImageIcon,
  info: Info,
  dashboard: LayoutDashboard,
  leaf: Leaf,
  logout: LogOut,
  mapPin: MapPin,
  menu: MenuIcon,
  minus: Minus,
  phone: Phone,
  plus: Plus,
  search: Search,
  settings: Settings,
  cart: ShoppingBag,
  trash: Trash2,
  utensils: Utensils,
  close: X,
};

const BRAND: Record<string, string> = {
  whatsapp: WHATSAPP_PATH,
  instagram: INSTAGRAM_PATH,
  facebook: FACEBOOK_PATH,
  tiktok: TIKTOK_PATH,
};

export type IconName = keyof typeof LUCIDE | keyof typeof BRAND;

/** Icons that point somewhere; these get mirrored when the page is RTL. */
const DIRECTIONAL = new Set([
  "arrowLeft",
  "arrowRight",
  "chevronLeft",
  "chevronRight",
  "logout",
]);

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  /** Set for decorative icons; the accessible name comes from the parent. */
  decorative?: boolean;
};

export function Icon({ name, size = 20, className = "", decorative = true }: IconProps) {
  const flip = DIRECTIONAL.has(name) ? "rtl:rotate-180" : "";
  const classes = `${flip} shrink-0 ${className}`;

  const brandPath = BRAND[name];
  if (brandPath) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={classes}
        aria-hidden={decorative || undefined}
        role={decorative ? undefined : "img"}
      >
        <path d={brandPath} />
      </svg>
    );
  }

  const LucideIconComponent = LUCIDE[name];
  return (
    <LucideIconComponent
      width={size}
      height={size}
      strokeWidth={2}
      className={classes}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
    />
  );
}