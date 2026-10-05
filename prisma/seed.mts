/**
 * Seeds the database with a realistic menu for معجنات الزيتونة.
 *
 *   pnpm db:seed
 *
 * Idempotent: menu tables are cleared and rebuilt, `Settings` is upserted. Safe
 * to run as often as you like while the site is still being built — it does not
 * touch orders.
 *
 * All money is in agorot (1 shekel = 100 agorot), same as the schema.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const WHATSAPP = "+970568502578";

/** Shekels -> agorot, so the prices below read like prices instead of integers. */
const shekels = (n: number) => Math.round(n * 100);

const OPENING_HOURS = {
  "0": { open: "08:00", close: "23:00" }, // الأحد
  "1": { open: "08:00", close: "23:00" }, // الاثنين
  "2": { open: "08:00", close: "23:00" }, // الثلاثاء
  "3": { open: "08:00", close: "23:00" }, // الأربعاء
  "4": { open: "08:00", close: "23:00" }, // الخميس
  "5": { open: "16:00", close: "23:00" }, // الجمعة — بعد الصلاة
  "6": { open: "09:00", close: "23:59" }, // السبت
};

const ORDERING_HOURS = {
  ...OPENING_HOURS,
  // The kitchen stops taking orders earlier than the shop stays open.
  "6": { open: "09:00", close: "22:30" },
};

type SeedDish = {
  name: string;
  slug: string;
  description: string;
  price: number;
  featured?: boolean;
  available?: boolean;
  special?: { offerPrice: number; label: string };
};

type SeedCategory = {
  name: string;
  dishes: SeedDish[];
};

const MENU: SeedCategory[] = [
  {
    name: "بيتزا على الحطب",
    dishes: [
      {
        name: "بيتزا مارغريتا",
        slug: "pizza-margherita",
        description: "صلصة طماطم، موزاريلا طازجة، وريحان على عجين يخبز في فرن الحطب.",
        price: shekels(38),
        featured: true,
      },
      {
        name: "بيتزا بيبروني",
        slug: "pizza-pepperoni",
        description: "بيبروني حار، موزاريلا، وصوص الفلفل الحار على عجين الحطب.",
        price: shekels(46),
        featured: true,
      },
      {
        name: "بيتزا الخضار",
        slug: "pizza-vegetables",
        description: "فلفل ألوان، ذرة، فطر، بصل، وزيتون أسود على قاعدة الطماطم.",
        price: shekels(42),
      },
      {
        name: "بيتزا الدجاج",
        slug: "pizza-chicken",
        description: "دجاج مشوي، ذري، صنوبر، وصوص الثوم الأبيض.",
        price: shekels(45),
      },
      {
        name: "بيتزا المشكلة",
        slug: "pizza-mixed",
        description: "مزيج من لحم العجل والدجاج مع الزعتر، على ذوقك.",
        price: shekels(49),
      },
      {
        name: "بيتزا المعجنات",
        slug: "pizza-pastry",
        description: "عجينة المعجنات التقليدية كقاعدة للبيتزا.",
        price: shekels(40),
        available: false,
      },
    ],
  },
  {
    name: "صفيحة وفطائر",
    dishes: [
      {
        name: "صفيحة دجاج",
        slug: "sfeeha-chicken",
        description: "صفيحة سميكة بالدجاج والبهارات، تُخبز على الحجر في الفرن.",
        price: shekels(38),
        featured: true,
      },
      {
        name: "صفيحة لحم",
        slug: "sfeeha-beef",
        description: "لحم مفروم مع البصل والبهارات على الصفيحة الحجرية.",
        price: shekels(42),
      },
      {
        name: "صفيحة زعتر",
        slug: "sfeeha-zaatar",
        description: "زعتر بلدي وزيت زيتون على عجينة الصفيحة.",
        price: shekels(18),
      },
      {
        name: "فطيرة جبنة عكاوي",
        slug: "fateereh-akawi",
        description: "جبنة عكاوي مذابة، سماق، وزيت زيتون.",
        price: shekels(22),
      },
      {
        name: "فطيرة سبانخ",
        slug: "fateereh-spinach",
        description: "سبانخ مع البصل والسماق، مع بيضة اختيارية.",
        price: shekels(18),
      },
      {
        name: "ورقة عنب",
        slug: "warak-enab",
        description: "ورق عنب محشو بالأرز والخضار، مطبوخ على الحطب.",
        price: shekels(32),
        featured: true,
      },
    ],
  },
  {
    name: "مناقيش",
    dishes: [
      {
        name: "منقوشة الزعتر",
        slug: "manakish-zaatar",
        description: "الطعم الأصلي: زعتر بلدي ممزوج بزيت الزيتون على عجينة طرية.",
        price: shekels(8),
        featured: true,
        special: { offerPrice: shekels(6), label: "خصم اليوم" },
      },
      {
        name: "منقوشة اللحم",
        slug: "manakish-beef",
        description: "لحم مفروم مع البصل والبهارات على عجينة طرية.",
        price: shekels(14),
      },
      {
        name: "منقوشة الدجاج",
        slug: "manakish-chicken",
        description: "دجاج مع صنوبر وصوص الثوم.",
        price: shekels(13),
      },
      {
        name: "منقوشة الجبنة",
        slug: "manakish-cheese",
        description: "جبنة بيضاء طازجة مع السماق.",
        price: shekels(9),
      },
      {
        name: "مقلوبة",
        slug: "maqluba",
        description: "أرز وباذنجان ولحم مفروم، مقلوبة على الطريقة التقليدية.",
        price: shekels(36),
      },
    ],
  },
  {
    name: "حلويات",
    dishes: [
      {
        name: "كنافة نابلسية",
        slug: "kunafa-nabulsi",
        description: "كنافة ساخنة بالقشطة، تُسقى بالقطر.",
        price: shekels(26),
        featured: true,
        special: { offerPrice: shekels(21), label: "عرض الأسبوع" },
      },
      {
        name: "بقلاوة",
        slug: "baklava",
        description: "أربعون طبقة عجين بالجوز والفستق الحلبي، مغموسة بالقطر.",
        price: shekels(28),
        featured: true,
      },
      {
        name: "معمول",
        slug: "maamoul",
        description: "معمول بالسمن والفستق، أو جوز حسب الموسم.",
        price: shekels(30),
      },
      {
        name: "غريبة",
        slug: "ghraiba",
        description: "حلوى السميد بالسمن والفستق، مقرمشة من برّه.",
        price: shekels(24),
      },
      {
        name: "هريسة",
        slug: "harissa",
        description: "حلوى السميد بالقشطة والدبس، تُقدّم باردة.",
        price: shekels(16),
      },
      {
        name: "عيش السرايا",
        slug: "seraya",
        description: "عيش مقرمش محلّى بالقطر ومغطّى بالقشطة.",
        price: shekels(12),
      },
    ],
  },
  {
    name: "مشاوي",
    dishes: [
      {
        name: "مشاوي مشكل",
        slug: "mixed-grill",
        description: "شيش طاووق، كباب، وفتوش على الحطب مع خبز التنور.",
        price: shekels(72),
        featured: true,
      },
      {
        name: "شيش طاووق",
        slug: "shish-tawook",
        description: "دجاج متبل بالليمون والثوم، طماطم، بصل، وخل.",
        price: shekels(38),
      },
      {
        name: "كباب حلبي",
        slug: "kabab-halabi",
        description: "لحم مفروم ناعم مع البقدونس والبهارات، مشوي على الفحم.",
        price: shekels(44),
      },
      {
        name: "فتوش",
        slug: "fattoush",
        description: "خضار مشكّلة مع خبز مقرمش، سماق، وخل الرمان.",
        price: shekels(26),
      },
      {
        name: "السلطة العربية",
        slug: "arabic-salad",
        description: "طماطم، خيار، فلفل، بقدونس، وليمون.",
        price: shekels(18),
      },
    ],
  },
  {
    name: "مشروبات",
    dishes: [
      {
        name: "ليمون بالنعناع",
        slug: "lemon-mint",
        description: "ليمون طازج مخفوق مع نعناع وثلج.",
        price: shekels(12),
      },
      {
        name: "كركديه",
        slug: "hibiscus",
        description: "منقوع كركديه بارد، محلّى قليلًا.",
        price: shekels(10),
      },
      {
        name: "عصير التوت",
        slug: "mulberry-juice",
        description: "عصير التوت الشامي الطبيعي.",
        price: shekels(11),
      },
      {
        name: "قهوة عربية",
        slug: "arabic-coffee",
        description: "قهوة عربية بالهيل، تُقدّم مع التمر.",
        price: shekels(8),
      },
      {
        name: "شاي",
        slug: "tea",
        description: "شاي أسود على الطريقة الفلسطينية.",
        price: shekels(5),
      },
      {
        name: "ماء",
        slug: "water",
        description: "ماء معدني بارد.",
        price: shekels(4),
      },
    ],
  },
];

async function seedSettings() {
  const data = {
    name: "معجنات الزيتونة",
    tagline: "بيتزا – صفيحة / معجنات على الحطب",
    story:
      "منذ 1996، ونحن نخبز الصفيحة والمعجنات على الحطب كما تعلمّمنا من جدّتنا: عجينة تُخبز في الفحم، وزعتر بلدي، وخبز صابون. مكونات طازجة كل صباح، بدون أي اختصارات.",
    address: "شارع المدينة، المقابل لمدرسة الزهراء",
    city: "الضفة الغربية",
    phone: "+970568502578",
    whatsapp: WHATSAPP,
    instagram: "alzaytouna_pastries",
    tiktok: "alzaytouna.pastries",
    email: "hello@alzaytouna.ps",
    mapUrl: "https://maps.google.com/?q=31.9,35.2",
    currency: "₪",
    timezone: "Asia/Jerusalem",
    openingHours: OPENING_HOURS,
    orderingHours: ORDERING_HOURS,
    deliveryFee: shekels(12),
    minOrder: shekels(50),
    deliveryAreas: "المدينة، الجامعة، دوار الشهداء",
    etaMinutes: 45,
  };

  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });
}

async function seedMenu() {
  await prisma.special.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();

  let dishCount = 0;

  for (const [categoryIndex, category] of MENU.entries()) {
    const created = await prisma.category.create({
      data: { name: category.name, sortOrder: categoryIndex },
    });

    for (const [dishIndex, dish] of category.dishes.entries()) {
      const row = await prisma.dish.create({
        data: {
          name: dish.name,
          slug: dish.slug,
          description: dish.description,
          price: dish.price,
          featured: dish.featured ?? false,
          available: dish.available ?? true,
          sortOrder: dishIndex,
          categoryId: created.id,
        },
      });

      if (dish.special) {
        await prisma.special.create({
          data: {
            dishId: row.id,
            offerPrice: dish.special.offerPrice,
            label: dish.special.label,
            active: true,
          },
        });
      }

      dishCount += 1;
    }
  }

  return dishCount;
}

async function seedAnnouncements() {
  await prisma.announcement.deleteMany();
  await prisma.announcement.create({
    data: {
      body: "التوصيل مجاني للطلبات فوق 100 ₪ داخل المدينة.",
      active: true,
    },
  });
}

/** A couple of orders so /admin has something to show on first run. */
async function seedOrders() {
  if ((await prisma.order.count()) > 0) return;

  const dishes = await prisma.dish.findMany({
    include: { specials: { where: { active: true }, take: 1 } },
  });

  const bySlug = new Map(dishes.map((d) => [d.slug, d]));

  const drafts = [
    {
      reference: "ZAY-1001",
      type: "DELIVERY" as const,
      status: "PENDING" as const,
      customerName: "سامر الكيلاني",
      phone: "+970599112233",
      address: "شارع الزعتر، بناء 12",
      notes: "من فضلك بدون بصل.",
      picks: [
        ["pizza-margherita", 1],
        ["manakish-zaatar", 3],
        ["lemon-mint", 2],
      ] as [string, number][],
    },
    {
      reference: "ZAY-1002",
      type: "PICKUP" as const,
      status: "PREPARING" as const,
      customerName: "مريم الحلبي",
      phone: "+970598765432",
      address: null,
      notes: null,
      picks: [
        ["kunafa-nabulsi", 2],
        ["mixed-grill", 1],
      ] as [string, number][],
    },
    {
      reference: "ZAY-1003",
      type: "DELIVERY" as const,
      status: "COMPLETED" as const,
      customerName: "أحمد نجم",
      phone: "+970597112233",
      address: "دوار الشهداء، شقة 4",
      notes: null,
      picks: [
        ["baklava", 1],
        ["maamoul", 1],
        ["kabab-halabi", 1],
      ] as [string, number][],
    },
  ];

  for (const order of drafts) {
    let subtotal = 0;

    const items = order.picks.flatMap(([slug, quantity]) => {
      const dish = bySlug.get(slug);
      if (!dish) return [];
      const unitPrice = dish.specials[0]?.offerPrice ?? dish.price;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      return [
        {
          dishId: dish.id,
          dishName: dish.name,
          unitPrice,
          quantity,
          lineTotal,
        },
      ];
    });

    const fee = order.type === "DELIVERY" ? shekels(12) : 0;

    await prisma.order.create({
      data: {
        reference: order.reference,
        type: order.type,
        status: order.status,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        notes: order.notes,
        subtotal,
        fee,
        total: subtotal + fee,
        whatsappSent: true,
        items: { create: items },
      },
    });
  }
}

async function main() {
  await seedSettings();
  const dishCount = await seedMenu();
  await seedAnnouncements();
  await seedOrders();

  // Printed so the owner can copy it into .env as ADMIN_PASSWORD_HASH.
  const hash = bcrypt.hashSync("admin1234", 10);
  console.log(`[db:seed] settings ✓  categories ${MENU.length}  dishes ${dishCount}`);
  console.log(`[db:seed] demo admin password "admin1234" hashes to: ${hash}`);
}

main()
  .catch((error) => {
    console.error("[db:seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });