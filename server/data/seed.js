import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

// Demo accounts for local testing only.
const users = [
  { id: 'u1', email: 'demo@example.com', name: 'Demo User', password: 'password123' },
  { id: 'u2', email: 'alex@example.com', name: 'Alex Morgan', password: 'alex1234' },
  { id: 'u3', email: 'sam@example.com', name: 'Sam Lee', password: 'sam12345' },
  { id: 'u4', email: 'jordan@example.com', name: 'Jordan Taylor', password: 'jordan123' },
];

// Prices are stored in cents.
const products = [
  {
    id: 'p1',
    name: 'Fresh Apples 1kg',
    description: 'Crisp, juicy apples picked at peak season. Great for snacking, lunchboxes and baking.',
    price: 349,
    image: '/images/p1.jpg',
    variants: [
      { id: 'p1-gala', label: 'Gala', stock: 12 },
      { id: 'p1-fuji', label: 'Fuji', stock: 20 },
      { id: 'p1-granny', label: 'Granny Smith', stock: 15 },
      { id: 'p1-pinklady', label: 'Pink Lady', stock: 0 },
    ],
  },
  {
    id: 'p2',
    name: 'Fresh Milk 1L',
    description: 'Farm-fresh pasteurised milk from local dairies. Keep refrigerated and use within 3 days of opening.',
    price: 149,
    image: '/images/p2.jpg',
    variants: [
      { id: 'p2-whole', label: 'Whole', stock: 6 },
      { id: 'p2-semi', label: 'Semi-Skimmed', stock: 10 },
      { id: 'p2-skimmed', label: 'Skimmed', stock: 8 },
      { id: 'p2-lactosefree', label: 'Lactose-Free', stock: 2 },
    ],
  },
  {
    id: 'p3',
    name: 'Free-Range Eggs (12)',
    description: 'A dozen eggs from free-range hens with rich, golden yolks.',
    price: 429,
    image: '/images/p3.jpg',
    variants: [
      { id: 'p3-medium', label: 'Medium', stock: 7 },
      { id: 'p3-large', label: 'Large', stock: 4 },
      { id: 'p3-xlarge', label: 'Extra Large', stock: 0 },
    ],
  },
  {
    id: 'p4',
    name: 'Freshly Baked Bread Loaf',
    description: 'Baked in-store every morning with a crackly crust and a soft, airy crumb.',
    price: 299,
    image: '/images/p4.jpg',
    variants: [
      { id: 'p4-white', label: 'White', stock: 5 },
      { id: 'p4-wholewheat', label: 'Whole Wheat', stock: 9 },
      { id: 'p4-multigrain', label: 'Multigrain', stock: 11 },
      { id: 'p4-sourdough', label: 'Sourdough', stock: 6 },
      { id: 'p4-rye', label: 'Rye', stock: 3 },
    ],
  },
  {
    id: 'p5',
    name: 'Extra Virgin Olive Oil 750ml',
    description: 'Cold-pressed from hand-picked olives. Fruity and peppery, perfect for salads and cooking.',
    price: 1299,
    image: '/images/p5.jpg',
    variants: [
      { id: 'p5-classic', label: 'Classic', stock: 4 },
      { id: 'p5-mild', label: 'Mild', stock: 3 },
    ],
  },
  {
    id: 'p6',
    name: 'Greek Yogurt 500g',
    description: 'Thick, creamy strained yogurt high in protein. Enjoy with fruit, granola or honey.',
    price: 389,
    image: '/images/p6.jpg',
    variants: [
      { id: 'p6-plain', label: 'Plain', stock: 25 },
      { id: 'p6-honey', label: 'Honey', stock: 14 },
      { id: 'p6-strawberry', label: 'Strawberry', stock: 9 },
    ],
  },
  {
    id: 'p7',
    name: 'Ground Coffee 250g',
    description: '100% Arabica beans, freshly roasted and ground for filter, cafetière or moka pot.',
    price: 799,
    image: '/images/p7.jpg',
    variants: [
      { id: 'p7-medium', label: 'Medium Roast', stock: 8 },
      { id: 'p7-dark', label: 'Dark Roast', stock: 5 },
    ],
  },
  {
    id: 'p8',
    name: 'Basmati Rice 1kg',
    description: 'Aged long-grain basmati that cooks up light, fluffy and fragrant.',
    price: 450,
    image: '/images/p8.jpg',
    variants: [{ id: 'p8-std', label: 'Standard', stock: 10 }],
  },
  {
    id: 'p9',
    name: 'Spaghetti Pasta 500g',
    description: 'Bronze-cut durum wheat pasta that holds sauce beautifully. Cooks in 9 minutes.',
    price: 189,
    image: '/images/p9.jpg',
    variants: [{ id: 'p9-std', label: 'Standard', stock: 18 }],
  },
  {
    id: 'p10',
    name: 'Mature Cheddar Cheese 200g',
    description: 'Aged for 12 months for a rich, tangy flavour. Great on sandwiches or melted.',
    price: 549,
    image: '/images/p10.jpg',
    variants: [{ id: 'p10-std', label: 'Standard', stock: 22 }],
  },
  {
    id: 'p11',
    name: 'Orange Juice 1L',
    description: 'Freshly squeezed, not from concentrate, with no added sugar.',
    price: 329,
    image: '/images/p11.jpg',
    variants: [
      { id: 'p11-pulp', label: 'With Pulp', stock: 12 },
      { id: 'p11-smooth', label: 'Smooth', stock: 7 },
    ],
  },
  {
    id: 'p12',
    name: 'Dark Chocolate 70% 100g',
    description: 'Smooth, intense dark chocolate made from fair-trade cocoa beans.',
    price: 275,
    image: '/images/p12.jpg',
    variants: [{ id: 'p12-std', label: 'Standard', stock: 3 }],
  },
  {
    id: 'p13',
    name: 'Vine Tomatoes 1kg',
    description: 'Sweet, ripe tomatoes grown on the vine. Ideal for salads, sauces and roasting.',
    price: 399,
    image: '/images/p13.jpg',
    variants: [{ id: 'p13-std', label: 'Standard', stock: 15 }],
  },
  {
    id: 'p14',
    name: 'Pure Wildflower Honey 350g',
    description: 'Raw, unfiltered honey collected from local beekeepers.',
    price: 899,
    image: '/images/p14.jpg',
    variants: [{ id: 'p14-std', label: 'Standard', stock: 0 }],
  },
  {
    id: 'p15',
    name: 'Crunchy Oat Cereal 500g',
    description: 'Wholegrain oat clusters baked until golden. A high-fibre start to the day.',
    price: 399,
    image: '/images/p15.jpg',
    variants: [
      { id: 'p15-original', label: 'Original', stock: 30 },
      { id: 'p15-honeynut', label: 'Honey Nut', stock: 24 },
      { id: 'p15-chocolate', label: 'Chocolate', stock: 16 },
    ],
  },
];
export function createSeedData() {
  return {
    users: users.map(({ password, ...user }) => ({
      ...user,
      passwordHash: bcrypt.hashSync(password, 10),
    })),
    products: structuredClone(products),
    carts: {},
    wishlists: {},
    orders: [],
  };
}

if (process.argv[1] === import.meta.filename) {
  const file = process.env.DB_FILE || path.join(import.meta.dirname, 'db.json');
  fs.writeFileSync(file, JSON.stringify(createSeedData(), null, 2));
  console.log(`Database reset: ${file}`);
}
