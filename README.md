# Uniblox Ecommerce Mini app (Assignment Submission)

This project implements a small ecommerce flow with:

- Add items to cart
- Checkout (create orders)
- Every **N**th order unlocks a **10% discount code** (default value is 5, so every 5th order)
- Admin APIs to generate discount code and view purchase stats
- Simple 2-page frontend UI to demonstrate the logic

No database is used. All data is stored **in-memory**.

---

## Tech Stack

- **Next.js (App Router) + TypeScript**
- **In-memory store** (singleton object in server memory)
- **Jest** for unit tests

---

## Getting Started

### 1) Install

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

App runs at:

- `http://localhost:3000`

### 3) Configure N (optional)

Discount unlock interval can be configured via env var (if implemented in your store config):

Create `.env.local`:

```bash
DISCOUNT_EVERY_N=5
```

If you didn’t wire an env var, default is `5` in the in-memory store.

---

## Frontend (Stretch Goal)

This repo includes a simple ecommerce-style UI:

- **`/`** Products page (add items to cart)
- **`/checkout`** Checkout page (review cart, apply discount code, place order, admin tools)

Use it to validate:

- Cart subtotal changes
- Checkout creates orders and clears cart
- Discount code generation + application
- Stats update correctly

---

## API Endpoints

### Cart

#### Add item to cart

`POST /api/cart/items`

Body:

```json
{
  "userId": "u1",
  "item": { "sku": "sku1", "name": "Shirt", "price": 1000, "qty": 2 }
}
```

Response:

```json
{
  "cart": { "userId": "u1", "items": [ ... ], "subtotal": 2000 },
  "subtotal": 2000
}
```

#### Get cart

`GET /api/cart?userId=u1`

Response:

```json
{
  "cart": { "userId": "u1", "items": [ ... ], "subtotal": 2000 },
  "subtotal": 2000
}
```

---

### Checkout

#### Checkout (place order)

`POST /api/checkout`

Body (no discount):

```json
{ "userId": "u1" }
```

Body (with discount):

```json
{ "userId": "u1", "discountCode": "SAVE10-XXXXXX" }
```

Behavior:

- Validates `userId`
- Cart must not be empty
- If `discountCode` is provided, it must match the **active** code and be **unused**
- Applies **10% discount** on the entire order subtotal
- Creates an order, clears cart, increments global order count

Response:

```json
{
  "order": {
    "id": "uuid",
    "userId": "u1",
    "items": [ ... ],
    "subtotal": 2000,
    "discount": 200,
    "total": 1800,
    "discountCodeUsed": "SAVE10-XXXXXX",
    "createdAt": "ISO_DATE"
  }
}
```

---

### Admin

#### Generate discount code

`POST /api/admin/discounts/generate`

Rules (matches assignment FAQ):

- Discount code becomes available on every **Nth order milestone**
- Only one code can be used **once**
- If a code is still active for the current milestone, the endpoint returns it (we can say its idempotent)
- If the milestone’s code was already **used** or **expired**, it does not generate another; the next one unlocks at the next milestone

Response:

```json
{
  "code": {
    "code": "SAVE10-XXXXXX",
    "percent": 10,
    "status": "active",
    "unlockedAtOrderNumber": 25
  }
}
```

#### Get stats

`GET /api/admin/stats`

Response:

```json
{
  "itemsPurchasedCount": 25,
  "totalPurchaseAmount": 29475,
  "totalDiscountAmount": 70,
  "discountCodes": [
    {
      "code": "SAVE10-...",
      "percent": 10,
      "status": "used|active|expired",
      "unlockedAtOrderNumber": 15,
      "usedAtOrderId": "uuid (optional)"
    }
  ]
}
```

---

## Manual API Testing (curl)

> Replace `u1` with your user id.

Add item:

```bash
curl -s -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","item":{"sku":"sku1","name":"Shirt","price":1000,"qty":2}}'
```

Get cart:

```bash
curl -s "http://localhost:3000/api/cart?userId=u1"
```

Checkout:

```bash
curl -s -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1"}'
```

Generate discount code (admin):

```bash
curl -s -X POST http://localhost:3000/api/admin/discounts/generate
```

Checkout with discount:

```bash
curl -s -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","discountCode":"SAVE10-XXXXXX"}'
```

Stats:

```bash
curl -s http://localhost:3000/api/admin/stats
```

---

## Running Unit Tests

### Install test deps (if not already installed)

```bash
npm i -D jest ts-jest @types/jest
```

### Run tests

```bash
npm test
```

### Watch mode

```bash
npm run test:watch
```

---

## Notes / Assumptions

- **In-memory store**: data resets if the server restarts.
- In dev, Next.js hot reload may reset in-memory state depending on how the runtime reloads modules.
- Discount applies to the **entire order**, not per item.
- Discount codes are **single-use**. Once used, they cannot be applied again.

---

## Project Structure (high level)

- `lib/`:

  - `cartService.ts` — cart operations + validation
  - `checkoutService.ts` — checkout flow + discount application
  - `adminService.ts` — discount generation + stats
  - `store.ts` — singleton in-memory store

- `app/api/*` — Next.js route handlers (API layer)
- `app/` — frontend pages (`/` and `/checkout`)
- `lib/__tests__/` — Jest unit tests

---
