"use client"

import Link from "next/link"
import { useCart } from "@/components/CartContext"

export default function Header() {
  const { itemCount, userId } = useCart()

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(10px)",
        background: "rgba(255,255,255,0.9)",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            ShopLite
          </Link>
          <span style={{ fontSize: 12, opacity: 0.6 }}>user: {userId}</span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" style={{ opacity: 0.9 }}>
            Products
          </Link>
          <Link
            href="/checkout"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              fontWeight: 600,
            }}
          >
            Cart
            <span
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                border: "1px solid #eee",
                padding: "0 6px",
              }}
            >
              {itemCount}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
