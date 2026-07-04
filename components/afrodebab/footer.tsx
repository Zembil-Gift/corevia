"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { Mail, MapPin, Phone, Linkedin, Twitter, Instagram } from "lucide-react"

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <footer className="relative bg-card/50 border-t border-border/50">
      {/* Contact Section */}
      <div className="container mx-auto px-4 md:px-6 py-20">
        <div ref={ref} className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Let's Build Together
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Whether you're a potential partner, investor, or user, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:afrodebab@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-background/50 text-foreground font-medium hover:bg-muted/50 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                afrodebab@gmail.com
              </a>
              <a
                href="mailto:info@afrodebab.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-background/50 text-foreground font-medium hover:bg-muted/50 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                info@afrodebab.com
              </a>
            </div>
          </motion.div>
        </div>

        {/* Footer Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 pb-12 border-b border-border/50">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/afrodebab-logo.png"
                  alt="AfroDebab"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <span className="text-xl font-semibold text-foreground">AfroDebab</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
                Empowering African innovation, connecting local markets with the diaspora, 
                and building trusted, scalable digital platforms.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <a href="tel:+19453993809" className="hover:text-foreground transition-colors">
                    +1 (945) 399-3809
                  </a>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span>Headquartered in Texas, USA</span>
                    <span>Operations & partnerships in Addis Ababa, Ethiopia</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Links Column */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#portfolio" className="text-muted-foreground hover:text-foreground transition-colors">
                    Portfolio
                  </a>
                </li>
                <li>
                  <a href="#team" className="text-muted-foreground hover:text-foreground transition-colors">
                    Team
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Products Column */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Products</h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://gogerami.com" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                    goGerami
                  </a>
                  <br/>
                  <a href="https://putnamtire.com" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                    Putnam Tire
                  </a>
                </li>
                <li>
                  <span className="text-muted-foreground/60">More coming soon...</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AfroDebab LLC. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
