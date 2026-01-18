"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { jsonFetch } from "@/lib/clientApi"

export type CartItem = {
  sku: string
  name: string
  price: number
  qty: number
}

export type Cart = {
  userId: string
  items: CartItem[]
  subtotal: number
}

export type AddItemInput = {
  sku: string
  name: string
  price: number
  qty: number
}

type CartContextValue = {
  userId: string
  setUserId: (id: string) => void
  cart: Cart | null
  itemCount: number
  isLoading: boolean
  error: string | null
  refreshCart: () => Promise<void>
  addToCart: (item: AddItemInput) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

function normalizeCart(raw: any): Cart | null {
  const c = raw?.cart ?? raw
  if (!c || !Array.isArray(c.items)) return null

  const subtotal = typeof c.subtotal === "number" ? c.subtotal : c.items.reduce((sum: number, i: CartItem) => sum + i.price * i.qty, 0)

  return { userId: c.userId, items: c.items, subtotal }
}

function makeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `u_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
  }
}

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "u1"

  const key = "ecom_userId"
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  const created = `u_${makeId()}`
  window.localStorage.setItem(key, created)
  return created
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState("u1")
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUserIdState(getOrCreateUserId())
  }, [])

  const setUserId = useCallback((id: string) => {
    setUserIdState(id)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecom_userId", id)
    }
    setCart(null)
  }, [])

  const refreshCart = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const r = await jsonFetch(`/api/cart?userId=${encodeURIComponent(userId)}`, { method: "GET" })
    if (!r.ok) {
      setIsLoading(false)
      setError(typeof r.data?.error === "string" ? r.data.error : `Request failed (${r.status})`)
      return
    }

    setCart(normalizeCart(r.data))
    setIsLoading(false)
  }, [userId])

  const addToCart = useCallback(
    async (item: AddItemInput) => {
      setIsLoading(true)
      setError(null)

      const r = await jsonFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ userId, item }),
      })

      if (!r.ok) {
        setIsLoading(false)
        setError(typeof r.data?.error === "string" ? r.data.error : `Request failed (${r.status})`)
        return
      }

      setCart(normalizeCart(r.data))
      setIsLoading(false)
    },
    [userId],
  )

  useEffect(() => {
    // initial hydrate
    refreshCart()
  }, [refreshCart])

  const itemCount = useMemo(() => cart?.items?.reduce((sum, i) => sum + i.qty, 0) ?? 0, [cart])

  const value = useMemo(
    () => ({ userId, setUserId, cart, itemCount, isLoading, error, refreshCart, addToCart }),
    [userId, setUserId, cart, itemCount, isLoading, error, refreshCart, addToCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within <CartProvider>")
  return ctx
}
