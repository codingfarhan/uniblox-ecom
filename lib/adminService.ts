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

export function generateDiscountCode(store: Store): { code: DiscountCode } {
  // if Nth order just happened a code can be generated.
  if (store.orderCount <= 0 || store.orderCount % store.discountEveryN !== 0) {
    throw new BadRequestError(`Not eligible yet. Generate is allowed only on every ${store.discountEveryN}th order.`)
  }

  // if there's an active unused code don't allow generating another.
  if (store.activeDiscountCode && store.activeDiscountCode.status === "active") {
    throw new BadRequestError("A discount code is already active")
  }

  // also prevent generating multiple codes for the same milestone, even if the first was used.
  const alreadyGeneratedForThisMilestone = store.discountCodes.some((c) => c.unlockedAtOrderNumber === store.orderCount)
  if (alreadyGeneratedForThisMilestone) {
    throw new BadRequestError("Discount code for this milestone was already generated")
  }

  expireActiveIfStale(store)

  const code: DiscountCode = {
    code: makeCode("SAVE10", 6),
    percent: 10,
    status: "active",
    unlockedAtOrderNumber: store.orderCount,
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
