"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ExternalLink, Gift, ShoppingBag, Rocket } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const brands = [
  {
    name: "goGerami",
    tagline: "Gifting Made Simple",
    description: "A diaspora-to-home gifting and local commerce platform that bridges distances through thoughtful connections.",
    status: "live",
    icon: Gift,
    gradient: "from-primary to-primary/70",
    features: ["Diaspora Gifting", "Local Commerce", "Secure Payments"],
    image: "/our-products/go-gerami.png",
    link: "https://gogerami.com",
  },
  {
    name: "Putnam Tire",
    tagline: "Reservations & Quotes Made Easy",
    description: "Tire repair shop based in Jackson, Mississippi",
    status: "live",
    icon: Rocket,
    gradient: "from-muted-foreground/30 to-muted-foreground/10",
    features: ["Tire Shop", "Auto Repair", "Reservations", "Quotes"],
    image: "/our-products/putnam-tire.png",
    link: "https://putnamtire.com",
  },
  {
    name: "Coming Soon",
    tagline: "Future Brand",
    description: "Another opportunity to connect communities and create value across borders.",
    status: "coming",
    icon: ShoppingBag,
    gradient: "from-muted-foreground/30 to-muted-foreground/10",
    features: ["Community", "Commerce", "Connection"],
  },
]

export function PortfolioSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div ref={ref} className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
              <span className="text-sm text-muted-foreground">Our Ecosystem</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Building the Future of{" "}
              <span className="text-primary">African Tech</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our portfolio of brands focuses on solving real problems and creating meaningful 
              connections between Africa and its global diaspora.
            </p>
          </motion.div>

          {/* Brand Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.name + index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`group relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 ${
                  brand.status === "coming" ? "opacity-75" : ""
                }`}
              >
                {/* Card Header */}
                <div className={`h-48 bg-cover bg-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                  {brand.image ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="absolute bottom-4 left-4">
                      <div className="w-12 h-12 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
                        <brand.icon className="w-6 h-6 text-background" />
                      </div>
                    </div>
                  )}
                  {brand.status === "live" && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 rounded-full bg-background/20 backdrop-blur-sm text-xs font-medium text-background">
                        Live
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">{brand.name}</h3>
                      <p className="text-sm text-secondary font-medium">{brand.tagline}</p>
                    </div>
                    {brand.status === "live" && brand.link && (
                      <button className="p-2 rounded-full hover:bg-muted transition-colors">
                        
                        <Link href={brand.link} target="_blank"><ExternalLink className="w-4 h-4 text-muted-foreground" /></Link>
                      </button>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {brand.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {brand.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
