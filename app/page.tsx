import { SiteHeader } from "@/components/mahberix/site-header"
import { Hero } from "@/components/mahberix/hero"
import { Features } from "@/components/mahberix/features"
import { Showcase } from "@/components/mahberix/showcase"
import { HowItWorks } from "@/components/mahberix/how-it-works"
import { Pricing } from "@/components/mahberix/pricing"
import { Faq } from "@/components/mahberix/faq"
import { CtaBand } from "@/components/mahberix/cta-band"
import { SiteFooter } from "@/components/mahberix/site-footer"

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main>
        <Hero />
  
        <Showcase />
        <Features />
        {/*<HowItWorks />*/}
        {/*<Pricing />*/}
        <CtaBand />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  )
}
