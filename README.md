# MiniMarket

A small Amazon-style online store built to learn full-stack development. It is not meant to be large scale. The goal is to understand how a database, an API, and a frontend fit together.

The project is developed step by step, including authentication, shopping, order management, admin tools, and interface design.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Styling | Tailwind CSS v4, custom light and dark themes |
| Backend | Node.js, Express |
| Database | PostgreSQL, tested locally with version 18 |
| Authentication | JWT + bcrypt password hashing |
| Product images | Multer memory storage + Cloudinary |
| Email | Nodemailer + Gmail SMTP |
| Planned hosting | Vercel for frontend/backend, Neon for PostgreSQL |

## Features

### Accounts

- Register and log in with hashed passwords and JWT tokens
- Automatically clear the session when an authenticated request returns an invalid or expired token
- Reset a forgotten password through an email link
- Hashed, expiring, single-use password-reset tokens
- Edit your profile name
- Change your password
- Add, edit, delete, and choose a default delivery address
- Account dropdown with account details, orders, and admin access

### Shopping

- Browse products without logging in
- Search products from the navbar
- Filter products by category
- Sort by newest, price, or name
- Paginated product results
- Product detail pages with images and stock information
- Low-stock and out-of-stock badges
- PHP currency formatting
- Shopping cart: add items, change quantities, and remove items
- Cart count in the navbar

### Orders

- Checkout converts cart items into an order inside a database transaction
- Buy now creates an order for one product without clearing the existing cart
- Delivery information is copied onto the order
- Order history and individual order details
- Order status tracking
- Cancelling an order restores its stock

Buy now creates a pending order after delivery details are confirmed. It does not collect a payment.

### Reviews

- Product ratings and customer reviews
- Customers can review a product after an order containing it is completed
- One review per customer and product
- Customers can update or delete their own reviews

### Administration

- Admin-only dashboard
- Monthly order-value graph covering the last twelve months
- Monthly order counts and average order values
- Order status summaries
- Stock alerts and top sellers
- Recent orders
- Product creation, editing, and deletion
- Category creation and deletion
- Order status management
- Responsive admin sidebar

Monthly analytics use order creation dates and exclude cancelled orders. Order value is not a record of payments collected.

### Interface

- Purple accent color
- Light and dark mode with a saved browser preference
- Responsive product grid and navigation
- Password visibility controls
- Loading states and form feedback
- Theme styling is still being refined across pages

## Project Structure

```text
Minimarket/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── ThemeToggle.jsx
│       │   ├── AuthForm.jsx
│       │   ├── AddressForm.jsx
│       │   ├── BuyNowPanel.jsx
│       │   ├── MonthlySalesChart.jsx
│       │   ├── AdminLayout.jsx
│       │   ├── AdminRoute.jsx
│       │   └── Stars.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── CartContext.jsx
│       ├── pages/
│       ├── utils/
│       │   └── currency.js
│       ├── api.js
│       ├── index.css
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── db/
│   │   └── schema.sql
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── rateLimiters.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── addresses.js
│   │   ├── reviews.js
│   │   ├── admin.js
│   │   └── upload.js
│   ├── utils/
│   │   └── sendResetEmail.js
│   ├── db.js
│   └── server.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js compatible with the installed Vite version
- npm
- PostgreSQL, tested with version 18
- Git
- A Cloudinary account for image uploads
- A Gmail account with an App Password for real reset emails

Development uses Windows, VS Code, and PowerShell.

### 1. Clone the repo

```powershell
git clone https://github.com/josholape/Minimarket.git
cd Minimarket
git switch dev
```

Branch usage:

- `main`: stable integration branch
- `dev`: active development branch

### 2. Set up the database

Open PostgreSQL:

```powershell
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE minimarket_db;
```

Exit psql:

```text
\q
```

From the project root, create the tables:

```powershell
psql -U postgres -d minimarket_db -f server/db/schema.sql
```

Run the full schema only against a fresh database. It is not a migration script for an existing database.

**Current schema limitation:** `schema.sql` does not yet include the `reviews` table required by the review routes. A fresh database needs that definition added before reviews will work. An existing local database may already contain it.

To inspect an existing database:

```powershell
psql -U postgres -d minimarket_db
```

Then:

```text
\d reviews
```

Do not drop an existing reviews table or rerun the full schema to fix this.

### 3. Configure the backend

Create `server/.env`:

```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=minimarket_db

PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_sender@gmail.com
EMAIL_PASS=your_gmail_app_password
```

These are placeholders. Never commit real credentials.

- `DB_PORT` is PostgreSQL's port: `5432`.
- `PORT` is Express's port: `5000`.
- `CLIENT_URL` is used to construct password-reset links.
- `EMAIL_USER` must match the Gmail account that created the App Password.
- Restart the backend after changing environment variables.

The current database configuration uses `DB_*` settings. Support for Neon's `DATABASE_URL` is pending.

### 4. Install and run

Keep two terminals running.

**Terminal 1: backend**

From the project root:

```powershell
cd server
npm install
npm run dev
```

**Terminal 2: frontend**

From the project root:

```powershell
cd client
npm install
npm run dev
```

Open [MiniMarket locally](http://localhost:5173).

The current Axios configuration uses:

```text
http://localhost:5000/api
```

Support for `VITE_API_URL` is pending.

### 5. Create an admin user

Register an account through the website.

Connect to PostgreSQL:

```powershell
psql -U postgres -d minimarket_db
```

At a clean `minimarket_db=#` prompt:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'you@example.com'
RETURNING id, email, is_admin;
```

Log out and log back in afterwards. Admin permissions are included in the JWT when logging in.

Categories and products can then be created through the admin pages.

### 6. Test password-reset emails

1. Register with an email inbox you can access.
2. Log out.
3. Open Forgot Password.
4. Enter that registered email.
5. Check the inbox and Spam folder.
6. Follow the link and set a new password.
7. Confirm the new password works and the old one fails.
8. Confirm the same reset link cannot be used again.

Localhost can send real emails through Gmail. A localhost reset link must be opened on the computer running the app.

The form deliberately returns a generic message whether or not the email is registered.

## API Reference

Local base URL:

```text
http://localhost:5000/api
```

Protected routes expect:

```http
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account |
| POST | `/auth/login` | Public | Return user and JWT |
| GET | `/auth/me` | Logged in | Get profile |
| PUT | `/auth/me` | Logged in | Update profile name |
| PUT | `/auth/password` | Logged in | Change password |
| POST | `/auth/forgot-password` | Public | Request a reset email |
| POST | `/auth/reset-password` | Public | Set a password using a reset token |

### Products and Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | List products |
| GET | `/products/:id` | Public | Get a product |
| POST | `/products` | Admin | Create a product |
| PUT | `/products/:id` | Admin | Update a product |
| DELETE | `/products/:id` | Admin | Delete a product |
| GET | `/categories` | Public | List categories |
| POST | `/categories` | Admin | Create a category |
| DELETE | `/categories/:id` | Admin | Delete a category |

Search, category filtering, sorting, and pagination currently run in the frontend after loading products.

### Cart

All cart routes require login.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | View your cart |
| POST | `/cart` | Add an item or increase its quantity |
| PUT | `/cart/:id` | Set a cart item's quantity |
| DELETE | `/cart/:id` | Remove a cart item |

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders/checkout` | Logged in | Convert the cart into an order |
| POST | `/orders/buy-now` | Logged in | Order one product without changing the cart |
| GET | `/orders` | Logged in | View your orders |
| GET | `/orders/:id` | Owner | View an order and its items |
| GET | `/orders/admin/all` | Admin | View all customer orders |
| PUT | `/orders/:id/status` | Admin | Update status and restore stock when cancelling |

### Addresses

All address routes require login and operate on the current user's addresses.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/addresses` | List saved addresses |
| POST | `/addresses` | Add an address |
| PUT | `/addresses/:id` | Update an address |
| PUT | `/addresses/:id/default` | Choose the default address |
| DELETE | `/addresses/:id` | Delete an address |

### Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reviews/product/:productId` | Public | Ratings summary and reviews |
| GET | `/reviews/product/:productId/mine` | Logged in | Your review and eligibility |
| POST | `/reviews/product/:productId` | Eligible customer | Create or update your review |
| DELETE | `/reviews/product/:productId` | Review owner | Delete your review |

### Admin Analytics

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | Totals, monthly analytics, stock alerts, and recent activity |

### Upload

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/upload` | Admin | Upload an image and return its Cloudinary URL |

Uploads use multipart form data with an `image` field.

The frontend currently checks a 4 MB limit. The backend still allows 5 MB; aligning both to 4 MB is pending.

## Database Design

The application uses these tables:

| Table | Purpose |
|---|---|
| `users` | Accounts and admin flags |
| `categories` | Product categories |
| `products` | Catalog, prices, stock, and image URLs |
| `cart_items` | Saved cart quantities |
| `orders` | Totals, statuses, and delivery snapshots |
| `order_items` | Products and prices recorded at purchase |
| `addresses` | Saved delivery addresses |
| `password_reset_tokens` | Hashed, expiring reset tokens |
| `reviews` | Customer ratings and comments |

The review table definition still needs adding to the checked-in schema.

Design decisions:

- Prices use `NUMERIC(10, 2)`.
- `order_items.price_at_purchase` preserves historical prices.
- Orders keep a copy of delivery details so later address edits do not change previous orders.
- A unique constraint prevents duplicate cart rows for the same customer and product.
- A partial unique index allows at most one default address per user.
- Password-reset tokens are stored as hashes.
- Checkout uses a transaction so order creation and stock updates succeed or roll back together.
- Buy now locks the product while checking and reducing stock.
- Additional locking for normal cart checkout is pending.

## Checks and Manual Testing

From `client/`:

```powershell
npm run lint
npm run build
```

The backend does not currently have a working automated test suite. Its `npm test` script is still a placeholder.

Manual checks:

- Register, log in, log out, and verify admin access
- Check expired-token handling
- Send and use a password-reset email
- Update profile and change password
- Add, edit, delete, and select a default address
- Search, filter, sort, and paginate products
- Add to cart, change quantity, and remove items
- Checkout with a saved or newly entered address
- Buy now while unrelated products remain in the cart
- Change order status and verify cancellation restores stock
- Create, update, and delete an eligible review
- Check monthly analytics after ordering and cancelling
- Check light/dark mode and smaller screens

## Development Progress

- [x] PostgreSQL and Express setup
- [x] Register/login with JWT authentication
- [x] Product and category management
- [x] Shopping cart and transactional checkout
- [x] Order history and order details
- [x] Profile and password management
- [x] Saved delivery addresses
- [x] Gmail password-reset emails
- [x] Cloudinary upload integration
- [x] Reviews and ratings
- [x] Search, filtering, sorting, and pagination
- [x] Buy now ordering
- [x] Admin sidebar and management pages
- [x] Monthly order analytics
- [x] Light/dark mode and purple theme
- [x] Finish UI consistency and accessibility checks
- [x] Add reviews to the checked-in schema
- [x] Fix normal checkout concurrency
- [x] Connect authentication rate limits and Helmet
- [x] Support deployment environment variables
- [x] Align upload limits to 4 MB
- [ ] Finish Neon and Vercel deployment
- [ ] Test the deployed site
- [ ] Google sign-in
- [ ] Payment-provider integration

## Deployment Plan

Planned services:

| Service | Purpose |
|---|---|
| Vercel client project | React frontend, root directory `client` |
| Vercel server project | Express API, root directory `server` |
| Neon | Hosted PostgreSQL database |
| Cloudinary | Product image storage |
| Gmail SMTP | Password-reset email delivery |

Deployment preparation is still in progress.

Before deployment:

- Add support for `DATABASE_URL` and use Neon's pooled connection string.
- Add support for `VITE_API_URL` and set it before the frontend build.
- Configure the exact frontend origin through `CLIENT_URL`.
- Prepare the Express entry point for hosting.
- Add a React Router SPA rewrite for page refreshes.
- Connect security middleware and rate limits.
- Use Cloudinary URLs instead of localhost image URLs.
- Apply a complete schema to the new database.
- Promote the intended admin account in the hosted database.

Creating tables does not copy local users, products, or orders into Neon.

Never paste real secrets into the README, chat, or commits.

## Git Workflow

Work on `dev` and merge tested changes into `main` through a pull request.

```powershell
git status
git add (type of the file)
git diff --cached
git commit -m "Describe the completed change"
git push origin dev
```

Before committing, confirm no `.env`, `node_modules`, or local uploaded images are staged.

Small, focused commits make changes easier to understand and undo.

## Lessons Learned

- **Register routes before starting the server.** Route files export their router with `module.exports = router;`.
- **Match filenames and import paths exactly**, including capitalization. Windows may hide mistakes that fail on Linux.
- **Replace the entire file when using a whole-file example.** An incomplete paste can leave missing braces or unfinished statements.
- **Keep database setup files current.** A working local database does not guarantee a fresh database will have every table.
- **Run SQL at a clean psql prompt.** End statements with `;`. A `-#` or `'#` prompt indicates unfinished input.
- **JWTs do not update automatically.** Log in again after changing admin permissions.
- **A transaction and a lock solve different problems.** Transactions group changes; locks coordinate concurrent requests.
- **Frontend validation does not replace backend validation.**
- **Use theme-aware background and text colors together.** A white background with inherited light text becomes unreadable.
- **Tailwind v4 uses `@import "tailwindcss";`** and the `@tailwindcss/vite` plugin.
- **Environment changes require restarting the relevant development server.**
- **Localhost can send real email.** SMTP configuration and a registered recipient account are what matter.
- **Keep secrets out of screenshots and Git.**
- **Check the HTTP method in Postman before sending a request.**
- **Test before committing and review the staged diff.**

## License

This is a learning project.

There is currently no standalone license file. The backend package metadata declares ISC; repository licensing should be clarified before distributing it for reuse.