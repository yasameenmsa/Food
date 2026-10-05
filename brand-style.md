# معجنات الزيتونة — Website Brand Style

**Brand:** معجنات الزيتونة (Al-Zaytouna Pastries / Olive Tree Pastries)
**Tagline:** بيتزا – صفيحة / معجنات على الحطب (Pizza, Sfeeha, wood-fired pastries)
**Tone:** Authentic, rustic, Palestinian heritage, home-baked, warm, trustworthy. Never flashy.

> Colors are estimated by eye from the banner, not pixel-sampled. Replace with exact values from the designer's source file if available.

---

## 1. Color Tokens

| Token | HEX | Usage |
|---|---|---|
| `--bg` | `#FCEBD9` | Page background (warm cream) |
| `--surface` | `#FFF6EC` | Cards, sections, inputs |
| `--primary` | `#4A4A28` | Headings, body text, buttons, icons, borders |
| `--secondary` | `#6E6E3C` | Secondary text, olive accents, hover on light |
| `--accent` | `#D9822B` | Fire accent: hover, highlights, badges (decorative only) |
| `--brown` | `#7A4420` | Oven/warm brown: footers, dark sections |
| `--stone` | `#D8C4A0` | Dividers, subtle backgrounds, borders |
| `--gold` | `#D4A056` | Food-tone highlights, rating stars, price tags |
| `--white` | `#FFFFFF` | QR code box, modals |

**Rule:** one dominant olive + cream. Orange is a small accent, never a main fill.

### Dark mode (optional)
| Token | HEX |
|---|---|
| `--bg` | `#23230F` |
| `--surface` | `#2E2E17` |
| `--primary` | `#F3E3CC` |
| `--secondary` | `#B8B87A` |
| `--accent` | `#E89A45` |

### Contrast
- `--primary` on `--bg`: passes WCAG AA/AAA for all text sizes.
- `--accent` on `--bg`: **fails** for small text. Use for icons, borders, large elements, or hover states only.
- Cream text on `--primary` buttons: passes AA.

---

## 2. Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Logotype | Custom textured brush Arabic (use SVG/PNG of the original) | Bold | Do not retype it. |
| Display (H1/H2) | **Lalezar** (fallback: Aref Ruqaa) | 400 | Closest free match to the logotype feel |
| Body / UI | **Cairo** (alt: Tajawal) | 400–700 | Clean Arabic + Latin support |
| Numbers / phone | Cairo | 700 | Latin numerals, `direction: ltr` |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Lalezar&display=swap" rel="stylesheet">
```

### Type scale
| Level | Size (desktop / mobile) | Font | Line height |
|---|---|---|---|
| H1 | 56px / 36px | Lalezar | 1.2 |
| H2 | 40px / 28px | Lalezar | 1.25 |
| H3 | 24px / 20px | Cairo 700 | 1.4 |
| Body | 18px / 16px | Cairo 400 | 1.7 |
| Small | 14px | Cairo 400 | 1.6 |

Arabic needs generous line height (1.6–1.8). No letter-spacing on Arabic text.

---

## 3. Logo & Symbols

- **Main mark:** olive tree (twisted trunk, olives) merged with a stone wood-fired oven with flame and bread.
  - Tree = heritage and land. Oven = tradition and wood-fired baking.
- **Style:** flat illustration, slight texture, dark olive outline.
- **Divider ornament:** olive branch between two thin olive lines. Reuse as section separator.
- **Clear space:** at least the height of the oven opening on all sides.
- **Min size:** 48px height on screen.
- **Backgrounds:** use on cream or white only. On dark sections use a cream version of the mark.

---

## 4. Layout Principles

- **Direction:** Arabic RTL by default (`dir="rtl"`).
- **Hero:** logo and contact on the right, name and tagline center-left, food photos framing the edges.
- Generous cream negative space. Thin olive divider lines between sections.
- Max content width: 1200px. Section padding: 80px desktop / 48px mobile.
- Grid: 12 columns desktop, 4 mobile. Gap 24px.

### Radius & elevation
| Token | Value |
|---|---|
| `--radius-sm` | 6px |
| `--radius` | 10px |
| `--radius-lg` | 20px |
| Shadow | `0 4px 14px rgba(74, 74, 40, 0.12)` (olive-tinted, never black) |

---

## 5. Components

### Buttons
| Type | Style |
|---|---|
| Primary | bg `--primary`, text `--bg`, radius 10px; hover bg `--accent` |
| Secondary | transparent, 2px `--primary` border, text `--primary`; hover bg `--primary`, text `--bg` |
| WhatsApp CTA | bg `--primary`, WhatsApp icon + number; the main conversion button |

### Icon chips
Solid `--primary` rounded square (radius 8px) with cream icon (WhatsApp, TikTok, phone, location).

### Contact block
WhatsApp icon + `+970568502578` (LTR), TikTok icon + handle, QR code in a white rounded box (radius 10px, 8px padding).

### Cards (menu items)
- bg `--surface`, 1px `--stone` border, radius 20px, olive-tinted shadow.
- Photo on top, warm golden tone, 4:3 crop.
- Title in Cairo 700 `--primary`, price in `--gold`/`--brown`.

### Header
Sticky, bg `--bg`, 1px `--stone` bottom border. Logo on the right, nav links, EN/AR toggle, WhatsApp button.

### Footer
bg `--brown`, text cream, olive-branch divider on top.

---

## 6. Imagery

- Real food photography with warm golden tones: za'atar and meat manakish, sambousek, sfeeha, pizza.
- Cropped at page edges as a frame; olive sprigs may overlap the corners.
- Warm color grade. Avoid cold, blue, or oversaturated filters.
- Show the wood-fired oven and fresh baking when possible.

---

## 7. Language / i18n

- Use **react-i18next** with a single **EN/AR toggle button** in the header, styled like a theme toggle and applied globally.
- Switching language must flip `dir` (`rtl` for AR, `ltr` for EN) and `lang` on `<html>`.
- Use CSS logical properties (`margin-inline-start`, `padding-inline-end`, `text-align: start`) so layouts flip cleanly.
- Keep phone numbers and URLs `direction: ltr` inside RTL text.

---

## 8. CSS Tokens

```css
:root {
  --bg: #FCEBD9;
  --surface: #FFF6EC;
  --primary: #4A4A28;
  --secondary: #6E6E3C;
  --accent: #D9822B;
  --brown: #7A4420;
  --stone: #D8C4A0;
  --gold: #D4A056;
  --white: #FFFFFF;

  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 20px;
  --shadow: 0 4px 14px rgba(74, 74, 40, 0.12);

  --font-display: 'Lalezar', 'Aref Ruqaa', serif;
  --font-body: 'Cairo', 'Tajawal', sans-serif;
}

html { direction: rtl; }
body {
  background: var(--bg);
  color: var(--primary);
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.7;
}
h1, h2 { font-family: var(--font-display); font-weight: 400; line-height: 1.2; }

.btn-primary {
  background: var(--primary);
  color: var(--bg);
  border: 2px solid var(--primary);
  border-radius: var(--radius);
  padding: 12px 28px;
  font-weight: 700;
  transition: background .2s, border-color .2s;
}
.btn-primary:hover { background: var(--accent); border-color: var(--accent); }

.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: var(--radius);
  padding: 12px 28px;
  font-weight: 700;
}
.btn-secondary:hover { background: var(--primary); color: var(--bg); }

.divider { border: 0; border-top: 1px solid var(--primary); opacity: .6; }
.ltr { direction: ltr; unicode-bidi: embed; }
```

## 9. Tailwind Config

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        bg: '#FCEBD9',
        surface: '#FFF6EC',
        primary: '#4A4A28',
        secondary: '#6E6E3C',
        accent: '#D9822B',
        brown: '#7A4420',
        stone: '#D8C4A0',
        gold: '#D4A056',
      },
      fontFamily: {
        display: ['Lalezar', 'Aref Ruqaa', 'serif'],
        body: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '10px', lg: '20px' },
      boxShadow: { brand: '0 4px 14px rgba(74, 74, 40, 0.12)' },
    },
  },
};
```

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Use olive + cream as the base | Use bright orange as a main fill |
| Use real warm food photos | Use stock cold-toned or glossy images |
| Keep generous negative space | Crowd sections with decoration |
| Use olive-tinted shadows | Use pure black shadows |
| Keep the logotype as an image | Retype the logotype in a font |
| Put the WhatsApp CTA in the header and hero | Hide ordering behind multiple clicks |

---

## 11. Gaps to Fill

- No defined secondary typeface or button style in the original banner (defined above as a proposal).
- Logotype needs vectorizing (SVG) from the designer's original file for crisp web use.
- Exact HEX values should be sampled from the source artwork.
