import { checkout } from "@/lib/checkoutService"
import { addItemToCart } from "@/lib/cartService"
import type { DiscountCode, Store } from "@/lib/types"

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    discountEveryN: 5,
    orderCount: 0,
    orders: [],
    cartsByUserId: new Map(),
    discountCodes: [],
    activeDiscountCode: undefined,
    ...overrides,
  } as Store
}

function activeCode(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return {
    code: "SAVE10-AAAAAA",
    percent: 10,
    status: "active",
    unlockedAtOrderNumber: 5,
    ...overrides,
  }
}

describe("checkoutService.checkout", () => {
  it("throws if userId is missing/blank", () => {
    const store = makeStore()
    // @ts-expect-error testing runtime validation
    expect(() => checkout(store, { userId: "" })).toThrow("userId is required")
    // @ts-expect-error testing runtime validation
    expect(() => checkout(store, { userId: "   " })).toThrow("userId is required")
  })

  it("throws if cart is empty", () => {
    const store = makeStore()
    expect(() => checkout(store, { userId: "u1" })).toThrow("Cart is empty")
  })

  it("creates an order without discount, clears cart, increments orderCount", () => {
    const store = makeStore()
    addItemToCart(store, "u1", { sku: "a", name: "A", price: 1000, qty: 2 }) // 2000
    addItemToCart(store, "u1", { sku: "b", name: "B", price: 500, qty: 1 }) // 500

    const { order } = checkout(store, { userId: "u1" })

    expect(order.userId).toBe("u1")
    expect(order.items).toHaveLength(2)
    expect(order.subtotal).toBe(2500)
    expect(order.discount).toBe(0)
    expect(order.total).toBe(2500)
    expect(order.discountCodeUsed).toBeUndefined()

    expect(store.orders).toHaveLength(1)
    expect(store.orders[0].id).toBe(order.id)

    // cart cleared
    const cart = store.cartsByUserId.get("u1")
    expect(cart?.items ?? []).toHaveLength(0)

    // global orderCount incremented
    expect(store.orderCount).toBe(1)
  })

  it("throws Invalid discount code when provided but no active code exists", () => {
    const store = makeStore()
    addItemToCart(store, "u1", { sku: "a", name: "A", price: 1000, qty: 1 })

    expect(() => checkout(store, { userId: "u1", discountCode: "SAVE10-AAAAAA" })).toThrow("Invalid discount code")
  })

  it("throws Invalid discount code when provided code doesn't match active code", () => {
    const store = makeStore({
      activeDiscountCode: activeCode({ code: "SAVE10-CORRECT" }),
    })
    addItemToCart(store, "u1", { sku: "a", name: "A", price: 1000, qty: 1 })

    expect(() => checkout(store, { userId: "u1", discountCode: "SAVE10-WRONG" })).toThrow("Invalid discount code")
  })

  it("throws Invalid discount code when active code is not active (used/expired)", () => {
    const store = makeStore({
      activeDiscountCode: activeCode({ status: "used" }),
    })
    addItemToCart(store, "u1", { sku: "a", name: "A", price: 1000, qty: 1 })

    expect(() => checkout(store, { userId: "u1", discountCode: "SAVE10-AAAAAA" })).toThrow("Invalid discount code")
  })

  it("applies discount for valid code, consumes it, clears cart, increments orderCount", () => {
    const code = activeCode({ code: "SAVE10-OK", percent: 10 })
    const store = makeStore({
      activeDiscountCode: code,
      discountCodes: [code],
    })

    addItemToCart(store, "u1", { sku: "a", name: "A", price: 999, qty: 1 }) // subtotal 999 -> 10% = 99.9 -> rounds to 100
    const { order } = checkout(store, { userId: "u1", discountCode: "SAVE10-OK" })

    expect(order.subtotal).toBe(999)
    expect(order.discount).toBe(100) // Math.round(99.9)
    expect(order.total).toBe(899)
    expect(order.discountCodeUsed).toBe("SAVE10-OK")

    // code consumed
    expect(code.status).toBe("used")
    expect(code.usedAtOrderId).toBe(order.id)
    expect(store.activeDiscountCode).toBeUndefined()

    // cart cleared
    const cart = store.cartsByUserId.get("u1")
    expect(cart?.items ?? []).toHaveLength(0)

    // orderCount incremented
    expect(store.orderCount).toBe(1)
  })

  it("expires an older active code when checkout hits a new milestone", () => {
    // Setup: orderCount=4, checkout increments to 5 (milestone for N=5)
    // active code is from earlier milestone 0/?? let's just say unlockedAtOrderNumber=0 or 1
    const old = activeCode({ code: "SAVE10-OLD", unlockedAtOrderNumber: 0 })
    const store = makeStore({
      discountEveryN: 5,
      orderCount: 4,
      activeDiscountCode: old,
      discountCodes: [old],
    })

    addItemToCart(store, "u1", { sku: "a", name: "A", price: 1000, qty: 1 })
    checkout(store, { userId: "u1" })

    // orderCount is now 5
    expect(store.orderCount).toBe(5)

    // old code should be expired and cleared because we hit a new unlock milestone (5)
    expect(old.status).toBe("expired")
    expect(store.activeDiscountCode).toBeUndefined()
  })

  it("does NOT expire the active code if it's for the current milestone", () => {
    // Setup: orderCount=4, after checkout => 5
    // active code unlockedAtOrderNumber=5 (current milestone) should remain valid
    const current = activeCode({ code: "SAVE10-CURR", unlockedAtOrderNumber: 5 })
    const store = makeStore({
      discountEveryN: 5,
      orderCount: 4,
      activeDiscountCode: current,
      discountCodes: [current],
    })

    addItemToCart(store, "u1", { sku: "a", name: "A", price: 1000, qty: 1 })
    checkout(store, { userId: "u1" })

    expect(store.orderCount).toBe(5)
    expect(current.status).toBe("active")
    expect(store.activeDiscountCode).toBe(current)
  })
})
