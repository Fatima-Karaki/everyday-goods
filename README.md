# Everyday Goods

A small e-commerce app: product listing and details with variants and stock, cart, wishlist, checkout and order confirmation.

- **Backend:** Node.js + Express, REST API under `/api`, data stored in a JSON file
- **Frontend:** React + Vite + React Router, plain CSS

## Getting started

Requires Node.js 20.11 or newer.

```bash
npm run install:all   # installs root, server and client dependencies
npm run dev           # API on http://localhost:4000, app on http://localhost:5173
```

Open http://localhost:5173 and log in with one of the demo accounts:

| Email | Password |
|---|---|
| `demo@example.com` | `password123` |
| `alex@example.com` | `alex1234` |
| `sam@example.com` | `sam12345` |
| `jordan@example.com` | `jordan123` |

Each account has its own cart, wishlist and orders. If your `server/data/db.json` was created before these accounts were added, run the seed script (below) to get them.

Other scripts:

```bash
npm test                   # backend API tests
npm run build              # production build of the client
npm --prefix server run seed   # reset the database to the seed data (stop the server first)
```

## How it works

- **Data:** `server/data/db.json` is created from `server/data/seed.js` on first start. Prices are stored in cents.
- **Auth:** a signed JWT in an httpOnly cookie. Browsing is public; cart, wishlist, checkout and orders require login. Set `JWT_SECRET` in production.
- **Stock:** checked when adding to or updating the cart, and checked again at checkout. Stock is only reduced when an order is placed. If any item can't be fulfilled, the whole order is rejected and nothing changes.
- **Checkout:** payment is mocked; an order needs only a shipping address.

## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/logout` | – |
| GET | `/api/auth/me` | ✓ |
| GET | `/api/products`, `/api/products/:id` | – |
| GET | `/api/cart` | ✓ |
| POST | `/api/cart/items` | ✓ |
| PATCH, DELETE | `/api/cart/items/:variantId` | ✓ |
| GET, POST | `/api/wishlist` | ✓ |
| DELETE | `/api/wishlist/:productId` | ✓ |
| POST | `/api/orders` | ✓ |
| GET | `/api/orders/:id` | ✓ |

Errors are returned as `{ "error": "message" }` with a matching HTTP status.

## Known limitations

- The JSON file store suits a single server process; it is not meant for concurrent writers or production scale.
- Changing a cart item's variant is done by the client as "add new variant, then remove old one" (two requests).
- Product images are placeholders.
