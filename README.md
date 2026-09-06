# MiniMarket — Progress Log

## Stack
React + Tailwind (client) | Node/Express + PostgreSQL (server)

## Status: Phase 6 in progress — Cart add/view confirmed working

### Done
- Phase 1-2: Project setup, PostgreSQL + Express connected
- Phase 3: Full schema created (users, categories, products, cart_items, orders, order_items)
- Phase 4: Auth API — register, login, JWT, authMiddleware (protected routes)
- Phase 5: Products API — full CRUD, public read / admin-only write, adminMiddleware
- Phase 6: Cart API — POST (add/increment) and GET (view with product JOIN) tested working

### Next up (Phase 6 remaining)
- Test PUT /api/cart/:id (update quantity)
- Test DELETE /api/cart/:id (remove item)
- Then Phase 7: Orders API (checkout — turns cart into an order, clears cart)

### Notes
- routes/cart.js required login on ALL routes via router.use(authMiddleware)
- ON CONFLICT (user_id, product_id) DO UPDATE handles "add same product twice" by incrementing quantity
- Gotcha hit today: filename mismatch (carts.js vs required './routes/cart') caused MODULE_NOT_FOUND — keep filenames matching require() paths exactly
- Test admin token still valid, test user: test@example.com / password123 (is_admin: true)
- Product id 2 = "Wireless Mouse" exists in DB for testing