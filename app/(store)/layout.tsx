import type { ReactNode } from "react";
import { StoreTemplate } from "@/components/templates/StoreTemplate";

/**
 * Everything under this group gets the storefront chrome: announcement bar,
 * nav, cart context and footer. `/login` and `/admin` sit outside it and build
 * their own shells.
 */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreTemplate>{children}</StoreTemplate>;
}
