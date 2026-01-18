"use client"

import { useState } from "react"
import { useCart } from "@/components/CartContext"

export type Product = {
  sku: string
  name: string
  description: string
  price: number
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, isLoading } = useCart()
  const [qty, setQty] = useState(1)

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 16,
        background: "white",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          height: 120,
          borderRadius: 12,
          border: "1px solid #f0f0f0",
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 750, letterSpacing: "-0.01em" }}>{product.name}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{product.description}</div>
        </div>
        <div style={{ fontWeight: 800, whiteSpace: "nowrap" }}>₹{product.price}</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto" }}>
        <label style={{ fontSize: 13, opacity: 0.8 }}>
          Qty
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            style={{
              width: 70,
              marginLeft: 8,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              background: "white",
            }}
          />
        </label>

        <button
          disabled={isLoading}
          onClick={() =>
            addToCart({ sku: product.sku, name: product.name, price: product.price, qty })
          }
          style={{
            marginLeft: "auto",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}
