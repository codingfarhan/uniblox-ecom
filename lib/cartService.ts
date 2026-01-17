import { Cart, CartItem, Money, Store } from "./types"

export class BadRequestError extends Error {
  status = 400 as const
}

export function calcSubtotal(items: CartItem[]): Money {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0)
}

export function getCart(store: Store, userId: string): { cart: Cart; subtotal: Money } {
  const cart = store.cartsByUserId.get(userId) ?? { userId, items: [] }
  // ensuring it's stored so subsequent mutations are consistent
  if (!store.cartsByUserId.has(userId)) store.cartsByUserId.set(userId, cart)
  return { cart, subtotal: calcSubtotal(cart.items) }
}

export function addItemToCart(store: Store, userId: string, item: CartItem): { cart: Cart; subtotal: Money } {
  if (!userId?.trim()) throw new BadRequestError("userId is required")
  if (!item?.sku?.trim()) throw new BadRequestError("item.sku is required")
  if (!item.name?.trim()) throw new BadRequestError("item.name is required")
  if (!Number.isFinite(item.price) || item.price < 0) throw new BadRequestError("item.price must be >= 0")
  if (!Number.isFinite(item.qty) || item.qty <= 0) throw new BadRequestError("item.qty must be > 0")

  const { cart } = getCart(store, userId)

  const idx = cart.items.findIndex((it) => it.sku === item.sku)
  if (idx >= 0) {
    const existing = cart.items[idx]
    cart.items[idx] = {
      ...existing,
      // here we're treating latest name/price as source of truth
      name: item.name,
      price: item.price,
      qty: existing.qty + item.qty,
    }
  } else {
    cart.items.push({ ...item })
  }

  return { cart, subtotal: calcSubtotal(cart.items) }
}

export function clearCart(store: Store, userId: string): void {
  store.cartsByUserId.set(userId, { userId, items: [] })
}
