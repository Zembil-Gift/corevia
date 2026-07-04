"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Globe, Shield, Zap } from "lucide-react"

export function HeroSection() {
  return (
    <section id="about" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 md:py-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/50 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Pan-African Technology Holding Company</span>
            </div>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <Image
              src="/afrodebab-logo.png"
              alt="AfroDebab Logo"
              width={120}
              height={120}
              className="drop-shadow-2xl"
              priority
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance"
          >
            Empowering{" "}
            <span className="text-primary">African Innovation</span>
            {" "}for a Connected World
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AfroDebab is a parent brand for transformative African technology products. 
            We connect local markets with the diaspora, building trusted, scalable digital platforms 
            that honor our heritage while embracing global opportunity.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Get In Touch
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-border bg-background/50 text-foreground font-medium hover:bg-muted/50 transition-all duration-200"
            >
              About Us
            </Link>
          </motion.div>

          {/* Value Props */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Global Reach</h3>
              <p className="text-sm text-muted-foreground text-center">Connecting Africa to the world and vice versa</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Trust & Security</h3>
              <p className="text-sm text-muted-foreground text-center">Building reliable platforms for all users</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Innovation</h3>
              <p className="text-sm text-muted-foreground text-center">Cutting-edge technology for real problems</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
