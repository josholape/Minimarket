# MiniMarket — Progress Log

## Stack
React + Tailwind (client) | Node/Express + PostgreSQL (server)

## Status: Phase 2 COMPLETE — Express + DB connection confirmed working

### Done
- PostgreSQL 18 installed, `minimarket_db` created
- /server scaffolded: express, pg, dotenv, cors, nodemon
- db.js — connection pool working
- server.js — test routes working (/ and /api/test-db)
- Fixed bug: DB_PORT was mistakenly set to 5000 (Express's port) instead of 5432 (Postgres's port)
- Git: main + dev branches on GitHub, main is default, working on dev

### Next up: Phase 3 — Database schema
- Design tables: users, products, categories, cart_items, orders, order_items
- Write SQL to create tables with proper relationships (foreign keys)
- Then Phase 4: Auth API (JWT, register/login)

### Notes
- Server runs on port 5000, Postgres on 5432 — don't mix these up in .env again
- npm run dev must be run from inside /server, not root
- .env is gitignored, recreate on new machines using .env structure below:
  DB_USER=postgres
  DB_PASSWORD= (password)
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=minimarket_db
  PORT=5000