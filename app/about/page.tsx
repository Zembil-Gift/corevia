"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { ABOUT_TIMELINE, GALLERY_IMAGES } from "@/lib/about-data"
import { Footer } from "@/components/afrodebab/footer"

export default function AboutPage() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const isTimelineInView = useInView(timelineRef, { once: true, amount: 0.2 })
  const isGalleryInView = useInView(galleryRef, { once: true, amount: 0.1 })
  const [gallerySelected, setGallerySelected] = useState<string | null>(null)

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74, 148, 115, 0.08), transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-4 z-[9999] mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg max-w-5xl px-4 py-2 mt-4">
        <Link
          className="flex items-center justify-center gap-3"
          href="/"
        >
          <Image
            src="/afrodebab-logo.png"
            alt="AfroDebab"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-semibold text-foreground tracking-tight">
            AfroDebab
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Intro */}
        <section className="text-center mb-16 md:mb-24">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            About AfroDebab
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            AfroDebab LLC is a Pan-African technology holding company dedicated to
            empowering African innovation and connecting local markets with the
            diaspora. We build trusted, scalable digital platforms that honor our
            heritage while embracing global opportunity.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Headquartered in Texas, USA, with operations and partnerships in Addis
            Ababa, Ethiopia, and across the continent, we focus on products that
            solve real problems—from fintech and agritech to developer tools and
            community platforms. Our flagship product, goGerami, reflects our
            commitment to quality and local relevance.
          </p>
        </section>

        {/* Timeline */}
        <section ref={timelineRef} className="mb-20 md:mb-28">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Our Journey
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] md:left-6 top-0 bottom-0 w-px bg-border" />

            <ul className="space-y-0">
              {ABOUT_TIMELINE.map((item, index) => (
                <motion.li
                  key={`${item.year}-${item.title}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={
                    isTimelineInView
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -20 }
                  }
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  className="relative flex gap-6 md:gap-8 pb-12 last:pb-0"
                >
                  {/* Node */}
                  <div className="relative z-10 shrink-0 w-12 h-12 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {item.year.slice(-2)}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-primary mb-1">
                      {item.year}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* Image gallery */}
        <section ref={galleryRef} className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Gallery
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {GALLERY_IMAGES.map((img, index) => (
              <motion.button
                key={img.src}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={
                  isGalleryInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.95 }
                }
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => setGallerySelected(img.src)}
                className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/30 hover:border-primary/40 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </motion.button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-muted-foreground mb-6">
            Want to learn more or get in touch?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Get In Touch
            </Link>
            <Link
              href="/#products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-muted/50 transition-colors font-medium"
            >
              Our Products
            </Link>
          </div>
        </section>
      </main>

      {/* Gallery lightbox */}
      {gallerySelected && (
        <button
          type="button"
          onClick={() => setGallerySelected(null)}
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 focus:outline-none"
          aria-label="Close gallery"
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={gallerySelected}
              alt="Gallery view"
              width={800}
              height={600}
              className="object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </button>
      )}

      <Footer />
    </div>
  )
}
