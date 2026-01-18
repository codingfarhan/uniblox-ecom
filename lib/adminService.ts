import crypto from "crypto"
import { DiscountCode, Money, Store } from "./types"
import { BadRequestError } from "./cartService"

function makeCode(prefix: string, len: number): string {
  const raw = crypto.randomBytes(16).toString("hex").toUpperCase()
  return `${prefix}-${raw.slice(0, len)}`
}

function expireActiveIfStale(store: Store): void {
  const active = store.activeDiscountCode
  if (!active) return
  if (active.status !== "active") {
    store.activeDiscountCode = undefined
    return
  }
  // if we've moved past the Nth order this code was created for, it's no longer valid.
  if (store.orderCount > active.unlockedAtOrderNumber && store.orderCount % store.discountEveryN === 0) {
    active.status = "expired"
    store.activeDiscountCode = undefined
  }
}

export function generateDiscountCode(store: Store): { code: DiscountCode; alreadyExisted?: boolean } {
  expireActiveIfStale(store)

  if (store.orderCount <= 0) {
    throw new BadRequestError("Not eligible yet. No orders have been placed.")
  }

  const n = store.discountEveryN
  const milestone = Math.floor(store.orderCount / n) * n

  if (milestone <= 0) {
    throw new BadRequestError(`Not eligible yet. First code unlocks at order ${n}.`)
  }

  // if there is an active code, return it (idempotent).
  if (store.activeDiscountCode?.status === "active") {
    return { code: store.activeDiscountCode, alreadyExisted: true }
  }

  // if a code already exists for this milestone...
  const existingForMilestone = store.discountCodes.find((c) => c.unlockedAtOrderNumber === milestone)
  if (existingForMilestone) {
    // ...return it ONLY if it's still active, otherwise not
    if (existingForMilestone.status === "active") {
      store.activeDiscountCode = existingForMilestone
      return { code: existingForMilestone, alreadyExisted: true }
    }

    const nextAt = milestone + n
    throw new BadRequestError(`Discount for order ${milestone} was already ${existingForMilestone.status}. Next code unlocks at order ${nextAt}.`)
  }

  // otherwise generate a fresh active code for the current milestone.
  const code: DiscountCode = {
    code: makeCode("SAVE10", 6),
    percent: 10,
    status: "active",
    unlockedAtOrderNumber: milestone,
  }

  store.discountCodes.push(code)
  store.activeDiscountCode = code

  return { code }
}

export function getStats(store: Store): {
  itemsPurchasedCount: number
  totalPurchaseAmount: Money
  totalDiscountAmount: Money
  discountCodes: DiscountCode[]
} {
  let itemsPurchasedCount = 0
  let totalPurchaseAmount: Money = 0
  let totalDiscountAmount: Money = 0

  for (const order of store.orders) {
    totalPurchaseAmount += order.subtotal
    totalDiscountAmount += order.discount
    for (const it of order.items) itemsPurchasedCount += it.qty
  }

  return {
    itemsPurchasedCount,
    totalPurchaseAmount,
    totalDiscountAmount,
    discountCodes: store.discountCodes.map((c) => ({ ...c })),
  }
}
