import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * The admin and the order flow are not for crawlers. `/cart` and `/order`
 * especially: a crawler that follows a prefilled order link would create junk
 * orders in the owner's dashboard.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/login", "/cart", "/order"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
