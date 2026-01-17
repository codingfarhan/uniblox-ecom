import { Store } from "./types"

function readDiscountEveryN(): number {
  // we get the Nth value where discount is to be applied from the .env file
  const raw = process.env.DISCOUNT_EVERY_N ?? process.env.NTH_ORDER ?? "5"
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 5
}

function createEmptyStore(): Store {
  return {
    discountEveryN: readDiscountEveryN(),
    orderCount: 0,
    cartsByUserId: new Map(),
    orders: [],
    discountCodes: [],
    activeDiscountCode: undefined,
  }
}

// we're declaring a global constant so the store values survives hot-reload more reliably
declare global {
  // eslint-disable-next-line no-var
  var __ECOM_STORE__: Store | undefined
}

export function getStore(): Store {
  if (!globalThis.__ECOM_STORE__) {
    globalThis.__ECOM_STORE__ = createEmptyStore()
  }
  // keeping the config fresh if env changes during dev
  globalThis.__ECOM_STORE__.discountEveryN = readDiscountEveryN()
  return globalThis.__ECOM_STORE__
}
