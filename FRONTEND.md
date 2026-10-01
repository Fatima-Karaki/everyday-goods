

The frontend is in /client directory and it uses React 19, Vite 8 for development and production builds, plain CSS in /src/styles/global.css


Structure: 
main.jsx: starts the app with BrowserRouter and AuthProvider
App.jsx: defines the layout and routes
api.js: handles all API requests
format.js: formats prices
context/AuthContext.jsx: manages the logged-in user and session
components:  shared UI such as the header, product cards, quantity controls, protected routes, and order items
pages:  one page component per route
styles/global.css — all frontend styling


Vite forwards /api requests to the backend running on port 4000. From the browser's perspective, both frontend and backend use the same origin, so no CORS configuration is required.

The app has public product and login pages. However, cart, wishlist, checkout, and order confirmation pages need authentication (user should be logged in to get their data).

State Management:
The only global state is authentication.
AuthContext stores the current user, loading state, and login() / logout() functions. It checks /auth/me when the app starts to restore an existing session.
Everything else is kept locally in the page that needs it. Products, cart, wishlist, and orders are loaded from the backend and updated using the API response.


API Communication:
API calls are done through api.js: 
- it adds /api to the request.
- sends cookies.
- handles JSON request and response bodies.
- convert server errors into a common ApiError


Main User Flow:
For example, when a user adds a product to the cart:
- The page checks whether the user is logged in.
- The add button is disabled while the request is running.
- The frontend sends the product, variant, and quantity to the backend.
- The backend validates the request and checks stock.
- The updated cart is returned to the frontend.
- The page updates the UI or shows the returned error.
The other pages follow the same general approach: load data, show the appropriate state, call the API when something changes, and update the UI from the server response.


Handling Edge Cases:
The frontend handles the main states and failure cases, including:
- loading, empty, error, and not-found states
- expired sessions
- out-of-stock products and variants
- quantities exceeding available stock
- slow or outdated API responses
- failed cart updates
Cart quantity changes are updated immediately in the UI. If the server rejects the change, the cart is reloaded to keep the UI in sync with the backend.
Checkout verifies stock again before placing the order, and the submit button is disabled while the request is being processed to prevent duplicate orders.

Forms And Validations:
- Login and checkout forms are validated on both the frontend and backend.
- The frontend gives users quick feedback for missing or invalid fields, while the backend validates the data again before processing the request.
- Quantity controls also prevent users from entering a quantity higher than the available stock.



UI and Responsive Design:
The UI uses a mobile-first approach with breakpoints at 640px and 1024px.
On smaller screens, the header switches to a hamburger menu. Product grids and cart/checkout layouts adjust to use more columns on larger screens.
Prices are stored as cents and formatted for display using Intl.NumberFormat.
Product images are static illustrations stored in client/public/images/.



Running the project: 
You need Node.js 20.11 or newer (node -v shows your version). From the project folder run:
npm run install:all    <!-- installs dependencies for the root, server and client -->
npm run dev           <!-- starts the API and the web app together-->
