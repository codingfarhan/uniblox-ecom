export type Money = number // storing as integer (e.g. cents) for simplicity

export type CartItem = {
  sku: string
  name: string
  price: Money
  qty: number
}

export type Cart = {
  userId: string
  items: CartItem[]
}

export type DiscountCodeStatus = "active" | "used" | "expired"

export type DiscountCode = {
  code: string
  percent: number // e.g. 10
  status: DiscountCodeStatus
  unlockedAtOrderNumber: number
  usedAtOrderId?: string
}

export type OrderItem = CartItem

export type Order = {
  id: string
  userId: string
  items: OrderItem[]
  subtotal: Money
  discount: Money
  total: Money
  discountCodeUsed?: string
  createdAt: string
}

export type Store = {
  discountEveryN: number
  orderCount: number
  cartsByUserId: Map<string, Cart>
  orders: Order[]
  discountCodes: DiscountCode[]
  activeDiscountCode?: DiscountCode
}
