# MiniMarket

A small Amazon-style online store built to learn full-stack development. It is not meant to be large scale. The goal is to understand how a database, an API and a frontend fit together.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |

## Features

- Register and login with hashed passwords and JWT tokens
- Browse products with categories (public, no login needed)
- Product detail page
- Shopping cart: add, change quantity, remove
- Checkout that turns a cart into an order inside a database transaction (order created, stock reduced, cart cleared, all or nothing)
- Order history API
- Admin-only product management (create, update, delete)

## Project Structure

```
Minimarket/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Navbar
│       ├── context/         # AuthContext (login state)
│       ├── pages/           # Home, ProductDetail, Login, Register, Cart
│       ├── api.js           # Axios instance (adds the JWT automatically)
│       ├── App.jsx          # Route table
│       └── main.jsx
├── server/                  # Express API
│   ├── db/schema.sql        # All table definitions
│   ├── middleware/          # authMiddleware, adminMiddleware
│   ├── routes/              # auth, products, cart, orders
│   ├── db.js                # PostgreSQL connection pool
│   └── server.js            # App entry point
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL (tested with version 18)

### 1. Clone the repo

```bash
git clone https://github.com/josholape/Minimarket.git
cd Minimarket
```

### 2. Set up the database

Log in to PostgreSQL and create the database:

```sql
CREATE DATABASE minimarket_db;
```

Then build the tables from the schema file:

```bash
cd server
psql -U postgres -d minimarket_db -f db/schema.sql
```

Add a few categories so products can be created:

```sql
INSERT INTO categories (name) VALUES ('Electronics'), ('Clothing'), ('Books');
```

### 3. Configure the backend

Create `server/.env` (this file is gitignored and must never be committed):

```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=minimarket_db
PORT=5000
JWT_SECRET=replace_with_a_long_random_string
```

`DB_PORT` is PostgreSQL's port (5432). `PORT` is the Express server's port (5000). Do not mix them up.

### 4. Install and run

You need two terminals running at the same time.

**Terminal 1: backend**

```bash
cd server
npm install
npm run dev
```

**Terminal 2: frontend**

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### 5. Create an admin user

Register a normal account in the app, then promote it in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

Log in again afterwards. The `isAdmin` flag is stored inside the JWT when you log in, so an old token will not pick up the change.

## API Reference

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account, returns user and token |
| POST | `/auth/login` | Public | Log in, returns user and token |
| GET | `/auth/me` | Logged in | Get the current user |

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | List all products with category name |
| GET | `/products/:id` | Public | Get one product |
| POST | `/products` | Admin | Create a product |
| PUT | `/products/:id` | Admin | Update a product |
| DELETE | `/products/:id` | Admin | Delete a product |

### Cart (login required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | View your cart |
| POST | `/cart` | Add an item (increases quantity if it already exists) |
| PUT | `/cart/:id` | Set the quantity of a cart item |
| DELETE | `/cart/:id` | Remove a cart item |

### Orders (login required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/checkout` | Convert the cart into an order |
| GET | `/orders` | Your order history |
| GET | `/orders/:id` | One order with its items |

Protected routes expect the header `Authorization: Bearer <token>`.

## Database Design

Six tables:

- `users`: accounts, with an `is_admin` flag
- `categories`: product categories
- `products`: items for sale, linked to a category
- `cart_items`: one row per user and product (a unique constraint prevents duplicates)
- `orders`: one row per checkout, with a total and a status
- `order_items`: the products inside each order

Design decisions worth remembering:

- Prices use `NUMERIC(10, 2)` instead of floats, to avoid rounding errors with money.
- `order_items.price_at_purchase` stores the price at the time of purchase, so old orders do not change when a product's price changes.
- Deleting a category keeps its products (`ON DELETE SET NULL`). Deleting a user removes their cart (`ON DELETE CASCADE`).
- Checkout runs inside a transaction (`BEGIN`, `COMMIT`, `ROLLBACK`) so a failure halfway never leaves half an order.

## Development Progress

- [x] Phase 1: Project setup, PostgreSQL, Express
- [x] Phase 2: Database connection verified
- [x] Phase 3: Schema design (6 tables)
- [x] Phase 4: Auth API (register, login, JWT middleware)
- [x] Phase 5: Products API (public read, admin-only write)
- [x] Phase 6: Cart API
- [x] Phase 7: Orders API with checkout transaction
- [x] Phase 8: React frontend (routing, auth context, product pages, cart and checkout)
- [x] Order history page
- [x] Admin page for managing products
- [x] Real product images
- [ ] Search and category filtering
- [ ] Cart item count in the navbar

## Lessons Learned

Problems hit along the way, kept here so they are not repeated:

- **`app.listen()` goes last** in `server.js`. Register all routes above it.
- **Every route file must end with `module.exports = router;`.** Without it, Express crashes with "argument handler must be a function".
- **Filenames must match `require()` and `import` paths exactly**, including capital letters. `Context` and `context` are the same folder on Windows but different folders on Linux.
- **Create files inside the folders their imports expect.** A file placed in `src/` will not be found by `import ... from '../api'` written for `src/pages/`.
- **A React component file needs an `export default`**, otherwise the browser reports "does not provide an export named 'default'".
- **Tailwind v4 needs `@import "tailwindcss";` in `index.css`** and the `@tailwindcss/vite` plugin (with the `@`) in `vite.config.js`.
- **Run `git init` at the project root**, not inside `server/` or a parent folder, and keep a `.gitignore` with `node_modules/` and `.env` at the root.
- **Check the HTTP method dropdown in Postman before sending.** A leftover DELETE deleted a test product.
- **JWTs do not update retroactively.** After changing `is_admin`, log in again to get a fresh token.

## License

Learning project, no license.