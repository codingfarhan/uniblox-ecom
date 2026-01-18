import type { Metadata } from "next"
import "./globals.css"
import Providers from "./providers"
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "ShopLite",
  description: "Simple ecommerce demo for cart + checkout + discount code APIs",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fafafa", color: "#111" }}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
