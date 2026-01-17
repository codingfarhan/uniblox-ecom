import { NextResponse } from "next/server"
import { z } from "zod"
import { getStore } from "@/lib/store"
import { addItemToCart, BadRequestError } from "@/lib/cartService"

export const runtime = "nodejs"

const bodySchema = z.object({
  userId: z.string().min(1),
  item: z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    price: z.number().nonnegative(),
    qty: z.number().int().positive(),
  }),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = bodySchema.parse(json)

    const store = getStore()
    const result = addItemToCart(store, body.userId, body.item)
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
