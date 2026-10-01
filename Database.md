Database:
there is no real database in this project. I used single JSON file places in /server/data/db.json and a small module db.js to handle reading and writing data.

I chose JSON file because the assessment asked for simple appropriate solution. It contains 4 demo users and 15 products. 
there is no ORM or query Library just array operations. 


How it works:
- When the server starts, it loads the whole JSON file into memory as a db object. If the file doesn't exist, it creates the initial data from createSeedData() in server/data/seed.js and writes it to disk.
- When something changes, save() writes the current db object back to db.json


Structure:
The json file contains 5 main collections:
users:  { id, email, name, passwordHash } 
products: { id, name, description, price, image, variants:  { id, label, stock }  } 
carts: { userId:  { productId, variantId, quantity }  }
wishlists: { userId:  productId, ...  }, 
orders:  { id, userId, status, createdAt, items: [...], total, shippingAddress: {...} } 



Users: 
- There are four demo users defined in seed.js.
- Passwords are hashed with bcryptjs before being stored.

Products:
- There are 15 products each with one or more variants and each having an image.
- Stock is stored separately for each variant.
- The price is stored at the product level, so all variants of a product currently have the same price.
- Prices are stored as cents (for example, 349 means $3.49) to avoid rounding issues.
- Total product stock is calculated by adding the stock of all its variants when needed.

Carts:
- Carts are stored by user ID and each item contains the productId, variantId, and quantity.
- Product details such as the name and price are looked up when the cart is returned, so the cart always uses the latest data.
- Adding the same variant again increases its quantity instead of creating another cart line.

Wishlists:
- Wishlists are stored by user ID and contain product IDs.
- Adding the same product twice doesn't create a duplicate.

Orders:
- Order IDs are generated with crypto.randomUUID().
- Each order stores a snapshot of the product details, including the name, variant, image, price, and subtotal, at the time of purchase.
- This means old orders don't change if the product is updated later.
- The shipping address is saved with the order after trimming extra spaces.
- The order status is always confirmed because payment is mocked.


Relationships and constraints:

There are no real primary keys, foreign keys, or indexes because the data is stored in JSON.
IDs such as userId, productId, and variantId are used to connect the data, and the route logic checks that they are valid.
For example, the cart checks that the product and variant exist, while orders check that the order belongs to the logged in user.


Request flow:

The routes handle the data directly without a separate service or repository layer:
Request ->  Express -> Auth -> Route -> Validation/Logic -> db -> save() -> Response
For example, adding to the cart validates the request, checks the product, variant, and stock, updates the cart, saves the data, and returns the updated cart.
note: I didn't add a repository layer because the data logic is small and a separate layer would mostly add extra code.

Consistency and checkout:
Checkout first checks all items before making any changes, so if one item is unavailable, the whole order is rejected with 409.
If everything is available, the stock is reduced, the order is created, the cart is cleared, and the data is saved.
Stock is not reserved when items are added to the cart, so two users can have the same item in their carts; the second checkout gets 409 if the stock is already gone.


Limitations:
Every change rewrites the entire JSON file, which is fine for this small dataset but wouldn't scale well.
A crash during a write could corrupt the file.
There is no schema validation if someone manually changes db.json.

For a real production application, I would use a proper database such as PostgreSQL or SQLite to get transactions, indexes, constraints, and safer handling of concurrent requests.
