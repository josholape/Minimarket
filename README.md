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

### Phase 5 details (Products API)
- Routes: GET / (public, list all w/ category JOIN), GET /:id (public), POST / PUT /:id DELETE /:id (admin-only via authMiddleware + adminMiddleware stacked)
- adminMiddleware created separately from authMiddleware — checks req.user.isAdmin, returns 403 if not admin (vs 401 if not logged in at all)
- Had to manually promote test user to is_admin = true directly in Postgres (no public admin signup, by design) — required logging in again afterward since JWT bakes in isAdmin at time of login/register, doesn't update retroactively
- Tested CREATE, READ (all + single), UPDATE — all confirmed working
- Gotcha: left Postman method dropdown on DELETE by mistake, accidentally deleted test product (id 1) instead of running the planned UPDATE test — confirmed DELETE endpoint works correctly (returned 404 on second delete attempt of same id), just wasn't the intended test. Recreated product as id 2 ("Wireless Mouse") to continue testing.
- Lesson: double-check the method dropdown in Postman before Send, especially when reusing a request tab

### Next up (Phase 6 remaining)
- Test PUT /api/cart/:id (update quantity) TESTED
- Test DELETE /api/cart/:id (remove item) ADDED
- Then Phase 7: Orders API (checkout — turns cart into an order, clears cart)

### Notes
- routes/cart.js required login on ALL routes via router.use(authMiddleware)
- ON CONFLICT (user_id, product_id) DO UPDATE handles "add same product twice" by incrementing quantity
- Gotcha hit today: filename mismatch (carts.js vs required './routes/cart') caused MODULE_NOT_FOUND — keep filenames matching require() paths exactly
- Test admin token still valid, test user: test@example.com / password123 (is_admin: true)
- Product id 2 = "Wireless Mouse" exists in DB for testing