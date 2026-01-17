import { NextResponse } from "next/server"
import { getStore } from "@/lib/store"
import { getCart } from "@/lib/cartService"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") ?? ""
    if (!userId.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const store = getStore()
    const result = getCart(store, userId)
    return NextResponse.json(result, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
