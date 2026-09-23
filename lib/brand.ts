/**
 * Central brand configuration for the Mahberix SaaS product.
 * Rename the platform, tagline, or marketing copy here in one place.
 */
export const brand = {
  name: "Mahberix",
  // Short value proposition used in hero + meta description.
  tagline: "Run your whole company from one platform",
  subtitle:
    "Hiring, employees, attendance, performance, payments and content. Mahberix gives every company one operations platform, without stitching six tools together.",
  domain: "mahberix.com",
  email: "hello@mahberix.com",
  // Primary marketing nav (section anchors on the landing page).
  nav: [
    { label: "Features", href: "#features" },
    { label: "Tour", href: "#showcase" },
    { label: "FAQ", href: "#faq" },
  ],
  social: {
    twitter: "https://twitter.com/",
    linkedin: "https://linkedin.com/",
    github: "https://github.com/",
  },
} as const

export type Brand = typeof brand
