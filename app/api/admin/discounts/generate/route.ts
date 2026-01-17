import { NextResponse } from "next/server"
import { getStore } from "@/lib/store"
import { generateDiscountCode } from "@/lib/adminService"
import { BadRequestError } from "@/lib/cartService"

export const runtime = "nodejs"

export async function POST() {
  try {
    const store = getStore()
    const result = generateDiscountCode(store)
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
