import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Noto_Sans_Ethiopic } from "next/font/google"
import { brand } from "@/lib/brand"
import { LangProvider } from "@/lib/i18n"
import { DialogHost } from "@/components/ui/app-dialog"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
})

// Ethiopic script for Amharic — the Latin fonts above have no ኡ/ሀ glyphs,
// so this is required for Amharic to render. Listed as a fallback in the
// font stack, so English is unaffected and Amharic glyphs resolve here.
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ethiopic",
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
  font-family: ${jakarta.style.fontFamily}, ${ethiopic.style.fontFamily};
  --font-sans: ${jakarta.style.fontFamily}, ${ethiopic.style.fontFamily};
}
        `}</style>
      </head>
      <body className={`${jakarta.variable} ${ethiopic.variable} antialiased`}>
        <LangProvider>{children}</LangProvider>
        <DialogHost />
      </body>
    </html>
  )
}
