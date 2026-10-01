AI in Development:

I used AI as part of the development process, mainly to speed up implementation, review, testing, and documentation. The main tool I used was Claude Code. 
I worked with it in stages, giving it clear requirements and constraints, then reviewing the results and asking for changes where needed.
Each stage had a specific goal and clear limits on what should and should not be changed.
I used it for development assistance, implementation, testing, code review, debugging.


1- Requirements and Initial Design:
Before writing the code, I reviewed the assessment requirements and prepared the implementation plan for the project.
I defined the main structure and approach, including:
- frontend and backend structure
- API design
- authentication approach
- data storage
- data models
- pages and components
- state management
- validation and edge cases
- responsive breakpoints

In order to keep the architecture simple and avoid unnecessary libraries, I decided to use a JSON file for storage, JWT authentication through an httpOnly cookie, and React Context for authentication state.
I then used Claude Code to help implement the plan step by step while keeping the agreed structure and scope.


2- Backend Development: 
The backend was built as an Express REST API using JSON file storage.
The implementation included:
- product and variant data
- stock management
- authentication using bcrypt and JWT
- cart and wishlist functionality
- checkout and orders
- API validation
- automated API tests
For example, I specified the validation expected when adding items to the cart: the product must exist, the selected variant must belong to that product, the quantity must be a positive whole number, and it must not exceed available stock.

I also kept the scope limited by explicitly excluding features such as sign-up, password reset, roles, and OAuth.


3- Frontend Development:
The frontend was built using Vite, React, React Router, and plain CSS.
I defined the frontend structure and used Claude to assist with the implementation, including:
- shared API communication
- authentication context
- protected routes
- login page
- reusable components
I kept the frontend simple and avoided additional libraries such as Redux, React Query, or a UI component library since they were not needed for this project's scope.



4- Product Pages
The product listing and product detail pages were then implemented using the real backend data and reusable components.


5- Cart and Wishlist
The next stage covered the cart and wishlist functionality, including:
- changing product variants
- keeping quantities within available stock
- empty states
- loading states
- error handling


6- Checkout and Orders
The checkout flow included a mocked payment process, protection against accidental duplicate orders, clearing the cart after a successful order, and an order confirmation page that continues to work after a page refresh.


7- Responsive Design
I reviewed the application across different screen sizes, including 320px, 375px, 414px, 640px, 768px, 1024px, and 1440px.
Based on the review, I asked Claude to adjust the layouts and styling to make the application responsive across different screen sizes.
The review and adjustments focused on practical issues such as horizontal scrolling, the mobile menu, forms, long text, layout changes, and making controls comfortable to use on smaller screens.


8- Final Review
I reviewed the complete application against the original requirements and asked Claude to perform a second review of the application so number of important edge cases were found, including:
- invalid login
- empty cart and wishlist
- invalid product and order IDs
- stock limits
- expired sessions
- checkout edge cases

9- Code Quality Cleanup
A final cleanup done by claude and reviewed by me removed unused imports, dead code, and comments that simply repeated what the code was already doing.
The goal was to improve readability without changing the application's existing behavior.

10- Additional Work
I also used Claude Code for several follow-up tasks:
- investigating why some product images appeared blank
- changing the catalogue to supermarket products
- updating the seed data, product names, prices, and variant IDs
- generating illustrated product images using Python/Pillow
- rebuilding db.json from the updated seed data

### My Role vs. AI's Role
Claude Code helped with the implementation, but I was responsible for the overall direction of the project.
I defined the requirements, scope, architecture, and development stages. I also set the main constraints, such as keeping the project simple, avoiding unnecessary dependencies, and not changing existing functionality without a reason.
Claude helped with writing the code, CSS, tests, and supporting files. I reviewed the results, identified issues, and asked for changes when needed.
This allowed me to use AI to speed up development while keeping the main technical decisions and final review under my responsibility.




Limitations and Risks:
Using AI for development also has some limitations:

- Code understanding: A large part of the code was AI-assisted, so I still need to understand and review the implementation. 
- Testing: Some tests were also created with AI assistance, so they may share some of the same assumptions as the code. Passing the tests does not guarantee that every issue has been covered.
- Browser testing: I manually tested the application in the browser to check the main user flows and different screen sizes.
- AI explanations: AI-generated explanations can sometimes be inaccurate, so I checked the implementation against the requirements instead of relying only on the AI's explanations.
- Product images: The final product images are illustrated images generated with Python/Pillow, not real product photos.