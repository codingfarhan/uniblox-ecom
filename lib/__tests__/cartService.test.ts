import { addItemToCart, calcSubtotal, clearCart, getCart, BadRequestError } from "@/lib/cartService"
import type { Store, CartItem } from "@/lib/types"

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    cartsByUserId: new Map(),
    ...overrides,
  } as Store
}

describe("cartService", () => {
  describe("calcSubtotal", () => {
    it("returns 0 for empty items", () => {
      expect(calcSubtotal([])).toBe(0)
    })

    it("sums price * qty across items", () => {
      const items: CartItem[] = [
        { sku: "a", name: "A", price: 100, qty: 2 }, // 200
        { sku: "b", name: "B", price: 75, qty: 3 }, // 225
      ]
      expect(calcSubtotal(items)).toBe(425)
    })
  })

  describe("getCart", () => {
    it("creates a new empty cart if none exists and stores it in the map", () => {
      const store = makeStore()
      const res = getCart(store, "u1")

      expect(res.cart).toEqual({ userId: "u1", items: [] })
      expect(res.subtotal).toBe(0)
      expect(store.cartsByUserId.has("u1")).toBe(true)
      expect(store.cartsByUserId.get("u1")).toBe(res.cart) // same reference
    })

    it("returns existing cart object (same reference) on subsequent calls", () => {
      const store = makeStore()
      const first = getCart(store, "u1")
      first.cart.items.push({ sku: "x", name: "X", price: 10, qty: 1 })

      const second = getCart(store, "u1")
      expect(second.cart).toBe(first.cart)
      expect(second.subtotal).toBe(10)
    })
  })

  describe("addItemToCart", () => {
    it("adds a new item to an empty cart", () => {
      const store = makeStore()
      const r = addItemToCart(store, "u1", { sku: "sku1", name: "Shirt", price: 1000, qty: 2 })

      expect(r.cart.userId).toBe("u1")
      expect(r.cart.items).toEqual([{ sku: "sku1", name: "Shirt", price: 1000, qty: 2 }])
      expect(r.subtotal).toBe(2000)
    })

    it("merges qty when adding an item with the same sku and updates name/price to latest", () => {
      const store = makeStore()

      addItemToCart(store, "u1", { sku: "sku1", name: "Old Name", price: 1000, qty: 2 })
      const r2 = addItemToCart(store, "u1", { sku: "sku1", name: "New Name", price: 1200, qty: 3 })

      expect(r2.cart.items).toHaveLength(1)
      expect(r2.cart.items[0]).toEqual({
        sku: "sku1",
        name: "New Name", // updated
        price: 1200, // updated
        qty: 5, // merged
      })
      expect(r2.subtotal).toBe(1200 * 5)
    })

    it("keeps separate items for different skus", () => {
      const store = makeStore()
      addItemToCart(store, "u1", { sku: "a", name: "A", price: 10, qty: 1 })
      const r = addItemToCart(store, "u1", { sku: "b", name: "B", price: 20, qty: 2 })

      expect(r.cart.items).toHaveLength(2)
      expect(r.subtotal).toBe(10 * 1 + 20 * 2)
    })

    it("throws if userId is missing/blank", () => {
      const store = makeStore()
      expect(() => addItemToCart(store, "", { sku: "a", name: "A", price: 10, qty: 1 })).toThrow(BadRequestError)
      expect(() => addItemToCart(store, "   ", { sku: "a", name: "A", price: 10, qty: 1 })).toThrow("userId is required")
    })

    it("throws if sku is missing/blank", () => {
      const store = makeStore()
      expect(() => addItemToCart(store, "u1", { sku: "", name: "A", price: 10, qty: 1 })).toThrow("item.sku is required")
    })

    it("throws if name is missing/blank", () => {
      const store = makeStore()
      expect(() => addItemToCart(store, "u1", { sku: "a", name: "", price: 10, qty: 1 })).toThrow("item.name is required")
    })

    it("throws if price is not finite or negative", () => {
      const store = makeStore()

      expect(() => addItemToCart(store, "u1", { sku: "a", name: "A", price: -1, qty: 1 })).toThrow("item.price must be >= 0")

      expect(() => addItemToCart(store, "u1", { sku: "a", name: "A", price: Number.NaN, qty: 1 })).toThrow("item.price must be >= 0")
    })

    it("throws if qty is not finite or <= 0", () => {
      const store = makeStore()

      expect(() => addItemToCart(store, "u1", { sku: "a", name: "A", price: 10, qty: 0 })).toThrow("item.qty must be > 0")

      expect(() => addItemToCart(store, "u1", { sku: "a", name: "A", price: 10, qty: Number.NaN })).toThrow("item.qty must be > 0")
    })
  })

  describe("clearCart", () => {
    it("empties the cart for the user", () => {
      const store = makeStore()
      addItemToCart(store, "u1", { sku: "a", name: "A", price: 10, qty: 2 })

      clearCart(store, "u1")
      const { cart, subtotal } = getCart(store, "u1")

      expect(cart.items).toEqual([])
      expect(subtotal).toBe(0)
    })

    it("creates an empty cart even if user had no cart", () => {
      const store = makeStore()
      clearCart(store, "u2")

      const { cart, subtotal } = getCart(store, "u2")
      expect(cart).toEqual({ userId: "u2", items: [] })
      expect(subtotal).toBe(0)
    })
  })
})
