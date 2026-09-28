import type { Metadata } from "next"
import { LegalPage, fetchLegal } from "@/components/mahberix/legal-page"

export const metadata: Metadata = { title: "Terms of Service | Mahberix" }

export default async function TermsPage() {
  return <LegalPage doc={await fetchLegal("terms")} fallbackTitle="Terms of Service" />
}
