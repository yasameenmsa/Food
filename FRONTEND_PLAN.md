# Front-End Plan: Pastry Shop Website

Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Atomic Design**
Direction: Arabic-only (RTL), mobile-first, fast, photo-led.

---

## 1. Principles

1. **Mobile first.** Most customers open the link from WhatsApp or Instagram on a phone. Design at 375px, then scale up.
2. **Photos sell.** The layout exists to show food; text is secondary.
3. **Server components by default.** Add `'use client'` only where the browser is needed (see section 6).
4. **State lives in the URL** for anything shareable (search, category, size, page).
5. **One path to action:** every product is two taps from "Order on WhatsApp".
6. **Arabic-only, RTL always.** Use logical utilities (`ms-`, `ps-`, `start-`, `end-`) everywhere.

---

## 2. Design tokens

Define once in `app/globals.css` (Tailwind v4 `@theme`); components use tokens, never raw hex.

| Token group | Starter values (replace with brand colors) |
|---|---|
| Primary | `brand-800`, hover `brand-900` (placeholder palette: amber) |
| Surface | white, stone-50 (page), stone-100 (placeholder) |
| Text | stone-900 (main), stone-600 (muted), stone-400 (hint) |
| Border | stone-200 / stone-300 |
| Success / Warning / Danger | green-700 / amber-600 / red-700 (status badges only) |
| Radius | `rounded-full` (buttons, chips, inputs), `rounded-2xl` (cards) |
| Spacing | 4px scale; section padding `py-12 md:py-20`; container `max-w-7xl px-4` |
| Shadows | one soft shadow for cards on hover, none by default |

**Typography**
- Font: **Cairo** or **Tajawal** (`next/font/google`, `subsets: ['arabic','latin']`, `display: 'swap'`).
- Scale: `text-sm` (meta), `text-base` (body), `text-lg` (card title), `text-2xl md:text-4xl` (section heading), `text-4xl md:text-6xl` (hero).
- Arabic needs a taller line-height: body `leading-7`, headings `leading-snug`.

**Dark mode:** not in v1. Revisit after launch.

> The reference repo contains no brand style (default Tailwind only). Edit the `--color-brand-*` block in `app/globals.css` once the shop provides colors; components already use `brand-*` classes.

---

## 3. Breakpoints and layout

| Name | Width | Menu grid | Sidebar |
|---|---|---|---|
| base | < 640 | 2 columns | Drawer (opens from a "Categories" button) |
| `sm` | 640 | 2 | Drawer |
| `md` | 768 | 3 | Drawer |
| `lg` | 1024 | 3 | Sticky left/right column (14rem) |
| `xl` | 1280 | 4 | Sticky column |

- Container: `mx-auto max-w-7xl px-4`.
- Never let the page scroll sideways; tables scroll inside `overflow-x-auto`.
- Touch targets at least 44px (buttons are `h-11`).

---

## 4. Component specs

Imports flow one way: atoms ← molecules ← organisms ← templates ← pages. Components receive plain DTOs (`types/`), never Prisma objects.

### Atoms
| Component | Props | States / notes |
|---|---|---|
| Button | `variant` primary/outline/ghost, `size` sm/md; `buttonStyles()` for `<a>`/`<Link>` | hover, focus-visible, disabled, loading (spinner) |
| Input | native input props | focus, error (red border + `aria-invalid`), disabled |
| Textarea, Select, Checkbox | same pattern as Input | needed for forms |
| Label | `htmlFor`, `required` | |
| Badge | `tone` default/success/warning/danger | status colors never rely on color alone (add text) |
| Chip | `active`, `href` | `aria-current` when active |
| Icon | `name`, `size` | wrap `lucide-react`; **flip directional icons in RTL** |
| Avatar, Spinner, Heading, Text, Divider | minimal | add on first use |

### Molecules
| Component | Composition | Behavior |
|---|---|---|
| SearchBar | Input + clear button | client; 300ms debounce; writes `?q=`; `role="search"` |
| SizeFilter | Chips S/M/L/XL | links, server-rendered; only shown for pizza |
| SizeSelector | Chips (radio semantics) | client; changes selected variant and price |
| CategoryLink | Link | active style, nested indent |
| PriceTag | text + struck-through original | "from" label when several variants; discount display |
| FormField | Label + Input + error + hint | links error with `aria-describedby` |
| NavItem | Link + Icon | active state from pathname |
| Pagination | Chips + prev/next | URL-driven (`?page=`) |

### Organisms
| Component | Contents | Notes |
|---|---|---|
| Navbar | logo, NavItems, auth links, mobile drawer | sticky, `backdrop-blur`, role-aware (Admin link only for admins) |
| Footer | hours, address, phone, WhatsApp, social | |
| Hero | headline, subline, two CTAs (View menu, WhatsApp), photo | the only image with `priority` |
| CategoryStrip | 3 to 4 large photo cards (Pizza / Sweets / Pastries) | links to `/menu?category=` |
| FeaturedProducts | ProductGrid of `isFeatured` | |
| DiscountBanner | text + CTA to `/discount` | hidden for users who already have a discount |
| Toolbar | SearchBar + SizeFilter + result count | |
| CategorySidebar | CategoryLinks (nested) | drawer on mobile |
| ProductCard | image, Badge, name, PriceTag, WhatsApp button | whole image/title is the link |
| ProductGrid | cards + empty state | |
| ProductGallery | main image (+ thumbs if several) | |
| LoginForm / RegisterForm | FormFields + Button | |
| DiscountForm | FormFields (reason, phone) + Button | hidden while an application is pending |
| ApplicationStatusCard | Badge + percent + code + copy button | |
| AdminSidebar, ProductTable, ProductForm, VariantsEditor, ApplicationsTable | | admin only |

### Templates
`StoreTemplate` (sidebar + toolbar + content) · `AuthTemplate` (centered card) · `AdminTemplate` (sidebar + top bar).

---

## 5. Page wireframes (mobile first)

### Home `/`
```
[Navbar]
[Hero: photo | headline | (View menu) (WhatsApp)]
[CategoryStrip: Pizza | Sweets | Pastries]
[FeaturedProducts: 4 cards]
[DiscountBanner: "Get a customer discount" → /discount]
[Hours + Location + Map link]
[Footer]
```

### Menu `/menu`
```
Mobile                         Desktop (lg+)
[Navbar]                       [Navbar]
[Search] [Categories ▾]        [Sidebar |  Search  Sizes  count ]
[Size chips (pizza)]           [        |  grid 3-4 columns      ]
[grid 2 cols]                  [        |  pagination            ]
[pagination]
```

### Product `/menu/[slug]`
```
[Image gallery]
[Badge: category]  [Name]
[Description]
[SizeSelector: S M L XL]   ← price updates
[PriceTag]
[Order on WhatsApp]  ← prefilled with product + size
[Related products]
```

### Discount `/discount`
```
No application      → [DiscountForm]
Pending             → [StatusCard: "Under review"]
Approved            → [StatusCard: percent + code + copy]
Rejected            → [StatusCard: reason] + [Re-apply]
```

### Admin product form `/admin/products/[id]/edit`
```
[Name AR*] [Name EN]
[Description AR] [Description EN]
[Category ▾] [Available ☑] [Featured ☐]
[Image upload + preview]
[Variants: label | price | available | ✕ ]  (+ Add variant)
[Save]
```

---

## 6. Server vs client boundary

| Client (`'use client'`) | Why |
|---|---|
| SearchBar | debounce + `router.replace` |
| SizeSelector | local selected variant |
| Navbar mobile drawer | open/close state |
| CategorySidebar drawer wrapper (mobile) | open/close state |
| Forms with live validation or pending state | `useActionState` / `useFormStatus` |
| ProductGallery (if thumbnails switch) | selected image |
| Copy-code button | clipboard API |

Everything else (pages, cards, grids, filters as links, tables) stays a **server component**.
Wrap any component using `useSearchParams` in `<Suspense>`.

---

## 7. State and data flow

| State | Where |
|---|---|
| search, category, size, page | URL search params |
| selected variant on product page | component state (optionally `?size=`) |
| session / role | server session, read in server components |
| form errors and pending | `useActionState` with server actions |
| drawer open/closed | component state |

No global store (Redux, Zustand) in v1.

Loading and errors: `loading.tsx` skeleton grids for `/menu`, `error.tsx` per route group with a retry button, `not-found.tsx` for unknown slugs.

---

## 8. Forms

- Server actions + zod validation; return field errors in the action state.
- Disable the submit button while pending; show a spinner.
- Inline error under each field (`FormField`), summary at top only for form-level errors.
- Preserve typed values after a failed submit.
- Success: toast or inline success state, never a silent redirect.
- Phone field: accept local format, normalize before saving.

---

## 9. Images and performance

- All photos via `next/image` with `sizes` set; `priority` only on the hero image.
- Aspect ratio fixed (`aspect-[4/3]`) so the grid never jumps.
- Compress to WebP/AVIF before upload; target under 200 KB per card image.
- Fonts via `next/font` (no render-blocking CSS).
- Targets (mobile, 4G): **LCP < 2.5s, CLS < 0.1, INP < 200ms**.
- Check with Lighthouse at the end of every phase, not only at launch.

---

## 10. Motion

Keep it subtle and fast (150 to 250ms).
- Card hover: slight image zoom and shadow.
- Drawer: slide + fade.
- Page content: no entrance animations on lists.
- Respect `prefers-reduced-motion` (disable zoom and slide).

---

## 11. Accessibility checklist

- [ ] Color contrast at least 4.5:1 for text (check amber on white and white on amber)
- [ ] Visible focus ring on every interactive element
- [ ] Every input has a visible label; errors tied with `aria-describedby`
- [ ] Images have Arabic `alt` (product name); decorative ones `alt=""`
- [ ] Drawer traps focus, closes on Esc, returns focus to the trigger
- [ ] Active nav item uses `aria-current`
- [ ] Result count uses `aria-live="polite"`
- [ ] Status never conveyed by color alone
- [ ] Fully usable with keyboard only (RTL)
- [ ] Tested on a real Android phone and an iPhone

---

## 12. RTL rules (Arabic only)

- `<html lang="ar" dir="rtl">` in the root layout; no language switching.
- Only logical Tailwind utilities: `ms-/me-`, `ps-/pe-`, `start-/end-`, `text-start`.
- Flip arrows and chevrons in RTL (`rtl:rotate-180`).
- Prices via `Intl.NumberFormat('ar', { style: 'currency', currency: 'ILS' })`; keep codes (`YAS-7K2Q`) as `dir="ltr"`.
- All UI text is written directly in Arabic in the components; product text comes from the DB (`name`, `description`).
- Check every page at 375px in RTL before marking it done.

---

## 13. SEO and sharing

- `metadata` per page (title, description in Arabic), `generateMetadata` for product pages.
- Open Graph image for Home and for each product (its photo).
- `sitemap.ts` and `robots.ts`.
- JSON-LD: `Restaurant`/`Bakery` on Home (hours, address), `Product` with `offers` on product pages.
- Clean URLs: `/menu/nabulsi-kunafa` (slug), never IDs.

---

## 14. Build order (front end)

Gate rule: each step must work in the browser before the next starts.

1. **Tokens + root layout** (done in starter): `globals.css` theme, Cairo font, `lang="ar" dir="rtl"`.
2. **Menu slice** (starter): verify search, category, size filter, loading, empty state.
3. **Navbar + Footer**: desktop menu, mobile drawer.
4. **Product page**: ProductGallery, SizeSelector, PriceTag, WhatsApp CTA.
5. **Home**: Hero, CategoryStrip, FeaturedProducts, hours/location, DiscountBanner.
6. **Contact page.**
7. **Auth screens**: AuthTemplate, FormField, LoginForm, RegisterForm.
8. **Discount page**: form + four status states.
9. **Admin shell**: AdminTemplate, ProductTable, ProductForm, VariantsEditor.
10. **Polish**: skeletons, error pages, a11y pass, Lighthouse, real-device test.

---

## 15. Definition of done (per page)

- [ ] Works at 375px, 768px, 1280px
- [ ] Correct in RTL
- [ ] Loading, empty, and error states exist
- [ ] Keyboard and screen-reader pass
- [ ] Lighthouse mobile: performance and accessibility both 90+
- [ ] No Prisma types imported in `components/`

---

## 16. Open questions

1. Brand: logo, colors, any existing Instagram look to match?
2. Photos: who provides them and when? (Needed before Phase 5 looks right.)
3. Hero content: one hero photo, or a small slider? (Recommendation: one photo.)
4. Language: **decided, Arabic only.**
5. Should logged-in customers see a persistent "Your discount: X%" indicator in the Navbar?
