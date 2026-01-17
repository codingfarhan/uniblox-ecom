import crypto from "crypto"
import { CartItem, Money, Order, Store } from "./types"
import { calcSubtotal, clearCart, getCart, BadRequestError } from "./cartService"

function roundMoney(x: number): Money {
  // money is stored as integer so discount calculation will also stay integer.
  return Math.round(x)
}

function expireActiveDiscountIfNeeded(store: Store): void {
  const active = store.activeDiscountCode
  if (!active) return
  if (active.status !== "active") {
    store.activeDiscountCode = undefined
    return
  }

  // In case that we hit a new Nth order, the previous unused active code should no longer be usable.
  // ("can be used only once before the next one becomes available on the next nth order")
  const currentUnlock = store.orderCount > 0 && store.orderCount % store.discountEveryN === 0
  if (currentUnlock && active.unlockedAtOrderNumber < store.orderCount) {
    active.status = "expired"
    store.activeDiscountCode = undefined
  }
}

export function checkout(store: Store, params: { userId: string; discountCode?: string | null }): { order: Order } {
  const userId = params.userId?.trim()
  if (!userId) throw new BadRequestError("userId is required")

  const { cart } = getCart(store, userId)
  if (!cart.items.length) throw new BadRequestError("Cart is empty")

  const items: CartItem[] = cart.items.map((it) => ({ ...it }))
  const subtotal = calcSubtotal(items)

  let discount: Money = 0
  let discountCodeUsed: string | undefined

  const providedCode = params.discountCode?.trim()
  if (providedCode) {
    const active = store.activeDiscountCode
    if (!active || active.status !== "active" || active.code !== providedCode) {
      throw new BadRequestError("Invalid discount code")
    }

    discount = roundMoney((subtotal * active.percent) / 100)
    discountCodeUsed = active.code
  }

  const total = subtotal - discount
  if (total < 0) throw new BadRequestError("Total cannot be negative")

  const id = crypto.randomUUID()
  const order: Order = {
    id,
    userId,
    items,
    subtotal,
    discount,
    total,
    discountCodeUsed,
    createdAt: new Date().toISOString(),
  }

  // Persist order
  store.orders.push(order)

  // Consume discount code (only once)
  if (providedCode) {
    const active = store.activeDiscountCode
    if (active && active.status === "active" && active.code === providedCode) {
      active.status = "used"
      active.usedAtOrderId = order.id
      store.activeDiscountCode = undefined
    }
  }

  // Clear cart
  clearCart(store, userId)

  // Increase global order count
  store.orderCount += 1

  // If this checkout made us hit the next unlock milestone, expire any still-active previous code
  // (handles edge cases where a code exists from an older milestone).
  expireActiveDiscountIfNeeded(store)

  return { order }
}
