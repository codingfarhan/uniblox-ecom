import ProductCard, { Product } from "@/components/ProductCard"

const products: Product[] = [
  {
    sku: "tee-black",
    name: "Basic Tee",
    description: "Soft cotton. Everyday fit.",
    price: 999,
  },
  {
    sku: "cap-stone",
    name: "Stone Cap",
    description: "Clean look. Adjustable strap.",
    price: 699,
  },
  {
    sku: "hoodie-ash",
    name: "Ash Hoodie",
    description: "Heavyweight. Cozy all day.",
    price: 1999,
  },
  {
    sku: "socks-white",
    name: "Crew Socks",
    description: "Cushioned. 3-pack.",
    price: 499,
  },
]

export default function ProductsPage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <section
        style={{
          border: "1px solid #eee",
          background: "white",
          borderRadius: 16,
          padding: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, letterSpacing: "-0.03em" }}>ShopLite</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.7 }}>
            2-page ecommerce UI wired to your in-memory cart + checkout + discount APIs.
          </p>
        </div>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid #eee",
            background: "#fafafa",
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          Tip: place orders until every nth order, then generate code in Checkout.
        </div>
      </section>

      <h2 style={{ margin: "22px 0 12px" }}>Products</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {products.map((p) => (
          <ProductCard key={p.sku} product={p} />
        ))}
      </div>

      <section style={{ marginTop: 22, opacity: 0.75, fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>What this proves</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Add items to cart via API</li>
          <li>Checkout creates orders and clears cart</li>
          <li>Discount codes apply to full order and are single-use</li>
        </ul>
      </section>
    </main>
  )
}
