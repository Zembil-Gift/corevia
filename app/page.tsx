import { SiteHeader } from "@/components/corevia/site-header"
import { Hero } from "@/components/corevia/hero"
import { Features } from "@/components/corevia/features"
import { Showcase } from "@/components/corevia/showcase"
import { HowItWorks } from "@/components/corevia/how-it-works"
import { Pricing } from "@/components/corevia/pricing"
import { Faq } from "@/components/corevia/faq"
import { CtaBand } from "@/components/corevia/cta-band"
import { SiteFooter } from "@/components/corevia/site-footer"

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
