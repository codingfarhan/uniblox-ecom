/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useMemo, useState } from "react"
import { jsonFetch } from "@/lib/clientApi"
import { useCart } from "@/components/CartContext"

export default function CheckoutPage() {
  const { cart, userId, refreshCart, isLoading, error } = useCart()

  const [discountCode, setDiscountCode] = useState("")
  const [checkoutResult, setCheckoutResult] = useState<any>(null)

  const [adminResult, setAdminResult] = useState<any>(null)
  const [statsResult, setStatsResult] = useState<any>(null)
  const [adminError, setAdminError] = useState<string | null>(null)

  const itemCount = useMemo(() => cart?.items?.reduce((s, i) => s + i.qty, 0) ?? 0, [cart])

  const subtotal = cart?.subtotal ?? 0

  const checkout = async () => {
    setCheckoutResult(null)
    setAdminError(null)

    const r = await jsonFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        userId,
        discountCode: discountCode.trim() || undefined,
      }),
    })

    if (!r.ok) {
      setCheckoutResult(r.data)
      return
    }

    setCheckoutResult(r.data)
    setDiscountCode("")
    await refreshCart()
  }

  const adminGenerateDiscount = async () => {
    setAdminError(null)
    setAdminResult(null)

    const r = await jsonFetch("/api/admin/discounts/generate", { method: "POST" })
    if (!r.ok) {
      setAdminError(typeof r.data?.error === "string" ? r.data.error : `Request failed (${r.status})`)
      setAdminResult(r.data)
      return
    }

    setAdminResult(r.data)
    const code = r.data?.code?.code
    if (typeof code === "string") setDiscountCode(code)
  }

  const adminStats = async () => {
    setAdminError(null)
    const r = await jsonFetch("/api/admin/stats", { method: "GET" })
    setStatsResult(r.data)
    if (!r.ok) {
      setAdminError(typeof r.data?.error === "string" ? r.data.error : `Request failed (${r.status})`)
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ margin: 0, letterSpacing: "-0.03em" }}>Checkout</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>Review your cart, apply discount code, and place the order.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
        <section style={{ border: "1px solid #eee", background: "white", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Cart</h2>
            <button
              onClick={refreshCart}
              disabled={isLoading}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", background: "white" }}
            >
              Refresh
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {itemCount === 0 ? (
              <div style={{ padding: 12, borderRadius: 12, background: "#fafafa", border: "1px dashed #ddd", opacity: 0.8 }}>
                Your cart is empty. Add products from the Products page.
              </div>
            ) : (
              cart?.items?.map((i) => (
                <div
                  key={i.sku}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      border: "1px solid #f0f0f0",
                      background: "#fafafa",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 750 }}>{i.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>SKU: {i.sku}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>₹{i.price * i.qty}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      ₹{i.price} x {i.qty}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {error ? (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid #f5c2c7", background: "#f8d7da" }}>{error}</div>
          ) : null}
        </section>

        <aside style={{ border: "1px solid #eee", background: "white", borderRadius: 16, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Summary</h2>

          <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.75 }}>Items</span>
              <span style={{ fontWeight: 700 }}>{itemCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.75 }}>Subtotal</span>
              <span style={{ fontWeight: 800 }}>₹{subtotal}</span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, opacity: 0.75 }}>Discount code</label>
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="SAVE10-XXXX"
              style={{
                marginTop: 6,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e5e5",
              }}
            />
          </div>

          <button
            disabled={isLoading || itemCount === 0}
            onClick={checkout}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              fontWeight: 800,
              cursor: isLoading || itemCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            Place order
          </button>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 800 }}>Admin tools</summary>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <button
                onClick={adminGenerateDiscount}
                style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}
              >
                Generate discount code
              </button>
              <button onClick={adminStats} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white" }}>
                Get stats
              </button>

              {adminError ? (
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #f5c2c7", background: "#f8d7da" }}>{adminError}</div>
              ) : null}

              {adminResult ? (
                <pre style={{ margin: 0, padding: 10, borderRadius: 12, background: "#fafafa", border: "1px solid #eee", overflow: "auto" }}>
                  {JSON.stringify(adminResult, null, 2)}
                </pre>
              ) : null}

              {statsResult ? (
                <pre style={{ margin: 0, padding: 10, borderRadius: 12, background: "#fafafa", border: "1px solid #eee", overflow: "auto" }}>
                  {JSON.stringify(statsResult, null, 2)}
                </pre>
              ) : null}
            </div>
          </details>
        </aside>
      </div>

      {checkoutResult ? (
        <section style={{ marginTop: 14, border: "1px solid #eee", background: "white", borderRadius: 16, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Last checkout response</h2>
          <pre style={{ margin: "12px 0 0", padding: 12, borderRadius: 12, background: "#fafafa", border: "1px solid #eee", overflow: "auto" }}>
            {JSON.stringify(checkoutResult, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  )
}
