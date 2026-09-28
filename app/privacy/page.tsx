import type { Metadata } from "next"
import { LegalPage, fetchLegal } from "@/components/mahberix/legal-page"

export const metadata: Metadata = { title: "Privacy Policy | Mahberix" }

export default async function PrivacyPage() {
  return <LegalPage doc={await fetchLegal("privacy")} fallbackTitle="Privacy Policy" />
}
