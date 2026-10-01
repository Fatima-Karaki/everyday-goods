The backend in this project is built with Node.js and Express. It is contained in /server directory 

Structure:
index.js: starts the server
app.js: builds the Express app
db.js: saves the JSON data file ( data is stored as JSON for this project)
/middleware/auth.js: handles authentication
/routes/auth.js: login, logout
products.js: get products 
cart.js: Cart CRUD operations
wishlist.js : Wishlist CRUD operations
orders.js: add order 
seed.js: to seed data if needed 
test/api.test.js : tests for the APIs 

the backend is designed in three layers: middleware, routes, and data module. Each route file contains its validations and business logic. 



All routes are under /api, and request and response bodies are JSON.
POST auth/login: sets the token cookie and returns user
POST auth/logout: clears the cookie
GET auth/me: gets user for the current session
GET /products: gets all products 
GET /products/id: returns product of specified id or not found
GET /cart: get the items in cart and total
POST /cart/items: adds an item to the cart using productId, variantId and optional quantity. Quantity defaults to 1
PATCH /cart/items: updates the item quantity
DELETE /cart/items: removes an item from the cart
GET /wishlist: returns the wishlist items
POST /wishlist: adds a product to the wishlist
DELETE /wishlist: removes a product from the wishlist
POST /orders: creates an order using the shipping address and returns 201 with the order
GET /orders: returns an order only if it belongs to the current user



Authentication:
uses a JWT stored in an httpOnly cookie. This project uses 4 seeded demo users.
Login flow: 
- The API checks that the email and password are provided.
- The email is trimmed and converted to lowercase.
- The user is found and the password is checked with bcrypt.
- If valid, a JWT containing the userId is created.
- The JWT expires after 7 days and is stored in the token cookie.
- Protected routes use requireAuth to check the cookie and load the user.


Validations: 
Cart: product must exist, selected variant should belong to the product, quantity must be positive whole number, requested quantity should be less than or equal to available stock.
Wishlist: product must exist.
Checkout: five address fields are required, cart is not empty, enough stock for every item.
Login: email and password should not be empty


Business Logic:
- Stock is checked when adding or updating cart items.
- Stock is not reserved at that point.
- Stock is only reduced during checkout.
- Checkout checks all items before changing anything.
- If one item does not have enough stock, the whole checkout is rejected.
- After a successful checkout, stock decrease, the order is created, the cart is cleared and the data is saved.
- Payment is mocked, so order needs only a valid shipping address to be created.
- All successful orders have the status confirmed.

Error handling:
Errors are returned in this format: 
{
  "error" : "message"
}
may include extra information as fields missing or  items stock 
status codes: 
400: invalid input
401: authentication needed
404: not found
409: stock conflict
500: unexpected server error


Environment Variables: 
server port : 4000
JWT_SECRET: dev-only-secret
no .env configuration file

Logging: 
- server logs when it starts
- unexpected errors are logged with console.error


Testing: 
API tests in server/test/api.test.js. Uses Node's built in test and supertest, and uses temporary database file.

Security:

- Passwords are stored as bcrypt hashes and never returned to frontend. 
- Authentication uses an httpOnly cookie.
- Users can only access their own cart, wishlist and orders.
- Orders use random UUIDs.
- A JWT secret is required in production.
