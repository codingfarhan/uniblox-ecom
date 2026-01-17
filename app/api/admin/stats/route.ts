import { NextResponse } from "next/server"
import { getStore } from "@/lib/store"
import { getStats } from "@/lib/adminService"

export const runtime = "nodejs"

export async function GET() {
  try {
    const store = getStore()
    const result = getStats(store)
    return NextResponse.json(result, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
