"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Linkedin } from "lucide-react"

const team = [
  {
    name: "Rekik H. Biyadgilign",
    role: "Founder & Chief Executive Officer (CEO)",
    bio: "Rekik is the Founder and CEO of AfroDebab, providing strategic direction and overall leadership for the company. With a strong background in full-stack software development and systems architecture, he leads AfroDebab's vision, partnerships, and platform strategy—driving the company's mission to build innovative, scalable digital solutions across Africa and global markets.",
    img: "/team/rekik.jpeg",
    linkedin: "https://www.linkedin.com/in/rekik-biya/",
  },
  {
    name: "Amanuel Lawro",
    role: "Co-Founder & Chief Technology Officer (CTO)",
    bio: "Amanuel serves as Co-Founder and CTO of AfroDebab, overseeing the company's technical architecture, engineering standards, and platform scalability. With deep expertise in modern web technologies and system design, he leads the development of secure, high-performance solutions that power AfroDebab's products and services.",
    img: "/team/amanuel-lawro.jpeg",
    linkedin: "https://www.linkedin.com/in/amanuel-lawro/",
  },
  {
    name: "Getachewu Bezu",
    role: "Co-Founder & Legal Advisor",
    bio: "Getachewu is Co-Founder and Legal Advisor at AfroDebab, providing guidance on corporate governance, contracts, and regulatory matters. With an academic and professional background in law, including international economic law and development policy, he supports AfroDebab's growth with a strong legal and compliance foundation.",
    img: "/team/getachew-bezu.jpeg",
    linkedin: "https://www.linkedin.com/in/getachew-bezu-839773137/",
  },
  {
    name: "Abel Abebe",
    role: "Co-Founder & Head of International Partnerships (goGerami Ethiopia)",
    bio: "Abel is Co-Founder and Head of International Partnerships for goGerami Ethiopia. He plays a key role in cross-border coordination, local operations, and partnership development. With a strong background in software engineering and mobile technologies, Abel bridges technical understanding with market execution to support AfroDebab's international expansion.",
    img: "/team/abel-abebe.png",
    linkedin: "https://www.linkedin.com/in/abel-abebe/",
  },
]

export function TeamSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent pointer-events-none" />

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
              <span className="text-sm text-muted-foreground">Our Team</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Leadership That{" "}
              <span className="text-primary">Inspires</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the leadership team behind AfroDebab—a group of founders and partners united by a shared vision to build scalable, impactful technology platforms that connect Africa with the global digital economy.
            </p>
          </motion.div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group text-center"
              >
                {/* Profile Image */}
                <div className="relative mb-6 mx-auto w-40 h-40">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-300" />
                  <img
                    src={member.img || "/placeholder.svg"}
                    alt={member.name}
                    className="relative w-full h-full rounded-full object-cover border-4 border-card shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm font-medium text-primary mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{member.bio}</p>

                {/* Social Links */}
                {member.linkedin && (
                  <div className="flex justify-center">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
