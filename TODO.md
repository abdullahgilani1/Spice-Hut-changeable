# TODO: Add Quantity Selector to Item Cards

## Steps to Complete

- [x] Update `addToCart` function in `frontend/src/User-Frontend/context.cart.jsx` to accept an optional `quantity` parameter (default 1).
- [x] In `frontend/src/User-Frontend/pages/Menu.jsx`, add state for tracking item quantities (e.g., an object keyed by item.\_id).
- [x] Render quantity selector (+ / - buttons and quantity display) only on item cards in search results.
- [x] Update the "Add to Cart" button on item cards to pass the selected quantity to `addToCart`.
- [x] Test the quantity selector functionality on item cards and ensure category cards remain unchanged.
- [x] Verify that cart updates correctly with selected quantities.
