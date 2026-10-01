Database:
there is no real database in this project. I used a single JSON file placed in /server/data/db.json and a small module db.js to handle reading and writing data.

I chose JSON file because the assessment asked for simple appropriate solution. It contains 4 demo users and 15 products. 
there is no ORM or query Library just array operations. 



How it works:
- When the server starts, it loads the whole JSON file into memory as a db object. If the file doesn't exist, it creates the initial data from createSeedData() in server/data/seed.js and writes it to disk.
- When something changes, save() writes the current db object back to db.json

## What I used

There is no real database in this project. All data lives in one JSON file, `server/data/db.json`, and is handled by a small module, `server/src/db.js` (about 20 lines).

I went with a JSON file because the assessment asked for "the simplest appropriate solution" for data storage. The app has four demo users, 15 products and a handful of carts and orders, so a database server, ORM or migrations would have been more setup than the project needs.

There is no ORM or query library. Data is read and changed with plain JavaScript array methods (`find`, `filter`, `push`, `reduce`).

## How it works

`db.js` does two things:

1. **On startup** it loads the whole file into memory as one object called `db`. If the file doesn't exist yet, it builds the data from `createSeedData()` in `server/data/seed.js` and writes it to disk first.
2. **`save()`** writes the whole `db` object back to the file with `fs.writeFileSync`.

Every route imports the same `db` object. Reads come straight from memory. A route that changes something edits the object and then calls `save()`.

The file path can be changed with the `DB_FILE` environment variable. The tests use this to run against a temporary file so they don't touch the real data.

`db.json` is not committed to git (it is in `.gitignore`); it is created from the seed data the first time the server starts. To reset it to the seed data, stop the server and run `npm --prefix server run seed`.

## Data shape

The file has five top-level collections:

```js
{
  users:     [ { id, email, name, passwordHash } ],
  products:  [ { id, name, description, price, image, variants: [ { id, label, stock } ] } ],
  carts:     { [userId]: [ { productId, variantId, quantity } ] },
  wishlists: { [userId]: [ productId, ... ] },
  orders:    [ { id, userId, status, createdAt, items: [...], total, shippingAddress: {...} } ]
}
```

### Users
- Four seeded demo users (`u1` to `u4`). They're defined in a `users` list at the top of `seed.js`, with plain-text passwords that are hashed when the seed data is built.
- Passwords are stored as bcrypt hashes (`bcryptjs`, cost 10), never in plain text.
- Users can't sign up, so this list never changes while the app runs.

### Products and variants
- 15 products, `p1` to `p15`. Variants are stored inside their product.
- **Stock is kept per variant, not per product.** For example, "Fresh Apples" has separate stock for Gala, Fuji and so on. Products with only one option still have a single "Standard" variant, so the cart and order code always works the same way.
- **The price belongs to the product, not the variant.** All options of a product cost the same. This is a limitation: two sizes of one product couldn't have different prices without changing the data shape.
- Prices are whole numbers of **cents** (`349` = $3.49). This avoids floating-point rounding in totals. The frontend converts to dollars only for display (`client/src/format.js`).
- The product list doesn't store total stock. The API works it out on each request by adding up the variant stock (`withStock()` in `routes/products.js`).

### Carts
- Stored as an object keyed by user ID. Each cart line holds only `productId`, `variantId` and `quantity`.
- The cart doesn't copy the price or name. `cartResponse()` in `routes/cart.js` looks them up from the product each time. Cart prices and stock are therefore always current.
- There is one line per variant. Adding a variant that's already in the cart increases its quantity instead of adding a second line.

### Wishlists
- Stored as an object keyed by user ID, holding a list of product IDs.
- The wishlist saves products, not variants.
- Adding the same product twice does nothing the second time.

### Orders
- Order IDs are random UUIDs (`crypto.randomUUID()`), so they're hard to guess.
- **Each order line is a copy (snapshot)** of the product's name, variant label, image, unit price and subtotal at the moment of ordering. This differs on purpose from the cart: an order shouldn't change if a product's price or name changes later. The cart, by contrast, should always show current data.
- The shipping address is saved on the order, with extra spaces trimmed.
- `status` is always `'confirmed'`, since payment is mocked.

## Relationships, keys and constraints

There are no real primary keys, foreign keys or indexes. A JSON file doesn't support them. In practice:

- **IDs:** products, variants and users have hand-written string IDs in the seed file. Orders get UUIDs.
- **"Foreign keys"** are plain ID values, like `userId` on an order or `productId`/`variantId` in a cart line. The route code checks them, not the storage:
  - Adding to the cart checks that the product exists and that the variant belongs to it (`findVariant()`).
  - Adding to the wishlist checks that the product exists.
  - Fetching an order checks that it belongs to the logged-in user. Someone else's order returns 404.
- If a cart line points to a variant that no longer exists, `cartResponse()` leaves it out, and checkout reports it as unavailable.
- **Indexes:** none. Every lookup scans the whole list with `find`. With 15 products and four users this doesn't matter, but it wouldn't scale.

## Request flow

This project has no separate service or repository layer. The Express route handlers read and write `db` themselves:

```
Request → Express (JSON body + cookie parsing) → requireAuth (protected routes)
        → route handler (validation + business logic) → in-memory db object
        → save() writes db.json → JSON response
```

For example, `POST /api/cart/items` checks the input, looks up the product and variant in `db.products`, checks the stock, updates `db.carts[userId]`, calls `save()`, and returns the rebuilt cart.

This works because there is so little data logic. A repository layer would mostly just wrap `db.products.find(...)`. The downside is that the storage code is spread across the route files. Moving to a real database later would mean changing every route, not one module.

## Consistency and "transactions"

There are no database transactions. Consistency comes from how Node.js runs code:

- The whole database is one in-memory object, and Node runs one piece of JavaScript at a time.
- The checkout handler (`POST /api/orders`) is **fully synchronous**. It never pauses (no `await`) between checking stock and reducing it.
- So two checkouts can't interleave. One finishes checking, decrementing and saving before the other starts.

Checkout is **all-or-nothing**. It first checks every cart line. If any line lacks stock (or its product/variant no longer exists), it returns `409` listing the problem items, and changes nothing: no stock is reduced and the cart is kept. Only when every line passes does it reduce the stock, create the order, clear the cart and save, all in one step.

Other stock rules:
- Adding to or updating the cart checks the requested quantity against current stock, but **doesn't reserve stock**. Stock is only reduced when an order is placed. Two users can therefore have the same last item in their carts, and whoever checks out second gets the `409`. The API test `checkout with insufficient stock rejects the whole order` covers this case.

## Trade-offs and limitations

- **Single process only.** The data lives in one process's memory. Running two server processes (or editing `db.json` while the server runs) would cause them to overwrite each other's changes. The README says this too.
- **Whole-file writes.** Every change rewrites the whole file synchronously. That's fine for this amount of data but gets slower as the file grows, and it briefly blocks the server while writing.
- **Writes aren't crash-safe.** `save()` writes directly over `db.json`. A crash in the middle of a write could leave a broken file. Writing to a temporary file and then renaming it would fix this, but I haven't done that.
- **No checks on the file's contents.** If `db.json` is edited by hand and breaks, the server will just fail when it reads the bad data.
- **Some data is never cleaned up.** Carts and wishlists for users who no longer exist would stay in the file. With no sign-up or account deletion, this can't currently happen.

Needs developer input: did you consider SQLite or another database first, and is there more to say about why you didn't use one?
