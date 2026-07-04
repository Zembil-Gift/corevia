/**
 * Central brand configuration for the Corevia SaaS product.
 * Rename the platform, tagline, or marketing copy here in one place.
 */
export const brand = {
  name: "Corevia",
  // Short value proposition used in hero + meta description.
  tagline: "Run your whole company from one platform",
  subtitle:
    "Hiring, employees, attendance, performance, payments and content. Corevia gives every company one operations platform, without stitching six tools together.",
  domain: "corevia.com",
  email: "hello@corevia.com",
  // Primary marketing nav (section anchors on the landing page).
  nav: [
    { label: "Product", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  social: {
    twitter: "https://twitter.com/",
    linkedin: "https://linkedin.com/",
    github: "https://github.com/",
  },
} as const

export type Brand = typeof brand
