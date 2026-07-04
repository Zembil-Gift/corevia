import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { brand } from "@/lib/brand"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.subtitle,
}

export const viewport = {
  themeColor: "#0a0c0b",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: ${jakarta.style.fontFamily};
  --font-sans: ${jakarta.style.fontFamily};
}
        `}</style>
      </head>
      <body className={`${jakarta.variable} antialiased`}>{children}</body>
    </html>
  )
}
