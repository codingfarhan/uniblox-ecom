import { generateDiscountCode } from "@/lib/adminService"
import type { Store, DiscountCode } from "@/lib/types"
import { BadRequestError } from "@/lib/cartService"

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    discountEveryN: 5,
    orderCount: 0,
    discountCodes: [],
    activeDiscountCode: undefined,
    ...overrides,
  } as Store
}

describe("adminService.generateDiscountCode (behavior tests)", () => {
  it("throws when no orders have been placed (orderCount <= 0)", () => {
    const store = makeStore({ orderCount: 0 })
    expect(() => generateDiscountCode(store)).toThrow(BadRequestError)
    expect(() => generateDiscountCode(store)).toThrow("Not eligible yet. No orders have been placed.")
  })

  it("throws when first milestone not reached (orderCount < N)", () => {
    const store = makeStore({ discountEveryN: 5, orderCount: 4 })
    expect(() => generateDiscountCode(store)).toThrow(BadRequestError)
    expect(() => generateDiscountCode(store)).toThrow("Not eligible yet. First code unlocks at order 5.")
  })

  it("expires a stale active code when we're at a new milestone (observable effect)", () => {
    const stale: DiscountCode = {
      code: "SAVE10-STALE",
      percent: 10,
      status: "active",
      unlockedAtOrderNumber: 5,
    }

    const store = makeStore({
      discountEveryN: 5,
      orderCount: 10, // the exact milestone
      activeDiscountCode: stale,
      discountCodes: [stale],
    })

    const res = generateDiscountCode(store)

    // stale should have been expired by expireActiveIfStale(...)
    expect(stale.status).toBe("expired")

    // new code should be for milestone 10
    expect(res.code.status).toBe("active")
    expect(res.code.unlockedAtOrderNumber).toBe(10)
    expect(store.activeDiscountCode?.status).toBe("active")
    expect(store.activeDiscountCode?.unlockedAtOrderNumber).toBe(10)
  })

  it("returns existing activeDiscountCode (idempotent)", () => {
    const active: DiscountCode = {
      code: "SAVE10-ACTIVE",
      percent: 10,
      status: "active",
      unlockedAtOrderNumber: 10,
    }

    const store = makeStore({
      orderCount: 12, // milestone=10
      activeDiscountCode: active,
      discountCodes: [active],
    })

    const res = generateDiscountCode(store)

    expect(res).toEqual({ code: active, alreadyExisted: true })
    expect(store.discountCodes).toHaveLength(1)
    expect(store.activeDiscountCode).toBe(active)
  })

  it("if a code exists for this milestone and is active, returns it and sets activeDiscountCode", () => {
    const milestoneCode: DiscountCode = {
      code: "SAVE10-M10",
      percent: 10,
      status: "active",
      unlockedAtOrderNumber: 10,
    }

    const store = makeStore({
      orderCount: 14, // milestone=10
      activeDiscountCode: undefined,
      discountCodes: [milestoneCode],
    })

    const res = generateDiscountCode(store)

    expect(res).toEqual({ code: milestoneCode, alreadyExisted: true })
    expect(store.activeDiscountCode).toBe(milestoneCode)
  })

  it("if a code exists for this milestone but is used, throws and mentions next milestone", () => {
    const used: DiscountCode = {
      code: "SAVE10-USED",
      percent: 10,
      status: "used",
      unlockedAtOrderNumber: 25,
      usedAtOrderId: "order_123",
    }

    const store = makeStore({
      discountEveryN: 5,
      orderCount: 28, // milestone=25
      activeDiscountCode: undefined,
      discountCodes: [used],
    })

    expect(() => generateDiscountCode(store)).toThrow(BadRequestError)
    expect(() => generateDiscountCode(store)).toThrow("Discount for order 25 was already used. Next code unlocks at order 30.")
  })

  it("if a code exists for this milestone but is expired, throws and mentions next milestone", () => {
    const expired: DiscountCode = {
      code: "SAVE10-EXP",
      percent: 10,
      status: "expired",
      unlockedAtOrderNumber: 10,
    }

    const store = makeStore({
      discountEveryN: 5,
      orderCount: 12, // milestone=10
      activeDiscountCode: undefined,
      discountCodes: [expired],
    })

    expect(() => generateDiscountCode(store)).toThrow(BadRequestError)
    expect(() => generateDiscountCode(store)).toThrow("Discount for order 10 was already expired. Next code unlocks at order 15.")
  })

  it("generates a fresh active code for the current milestone when none exists", () => {
    const store = makeStore({
      discountEveryN: 5,
      orderCount: 27, // milestone=25
      activeDiscountCode: undefined,
      discountCodes: [],
    })

    const res = generateDiscountCode(store)

    expect(res.code.status).toBe("active")
    expect(res.code.percent).toBe(10)
    expect(res.code.unlockedAtOrderNumber).toBe(25)
    expect(typeof res.code.code).toBe("string")
    expect(res.code.code.startsWith("SAVE10-")).toBe(true)

    expect(store.activeDiscountCode).toBe(res.code)
    expect(store.discountCodes).toHaveLength(1)
    expect(store.discountCodes[0]).toBe(res.code)
  })

  it("does not generate a second code for the same milestone if it was already used", () => {
    const used: DiscountCode = {
      code: "SAVE10-USED2",
      percent: 10,
      status: "used",
      unlockedAtOrderNumber: 5,
      usedAtOrderId: "order_abc",
    }

    const store = makeStore({
      discountEveryN: 5,
      orderCount: 6, // milestone=5
      activeDiscountCode: undefined,
      discountCodes: [used],
    })

    expect(() => generateDiscountCode(store)).toThrow("Next code unlocks at order 10.")
  })
})
