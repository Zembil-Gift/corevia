"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Marquee } from "@/components/magicui/marquee"
import Image from "next/image"

const techStack = [
  {
    name: "Next.js",
    icon: "/tech-stack/Next.js Icon.png",
  },
  {
    name: "React",
    icon: "/tech-stack/React Icon.png",
  },
  {
    name: "TypeScript",
    icon: "/tech-stack/TypeScript Icon.png",
  },
  {
    name: "JavaScript",
    icon: "/tech-stack/JavaScript Icon.png",
  },
  {
    name: "Node.js",
    icon: "/tech-stack/Node.js Icon.png",
  },
  {
    name: "Java",
    icon: "/tech-stack/Java Icon.png",
  },
  {
    name: "Python",
    icon: "/tech-stack/Python Icon.png",
  },
  {
    name: "Flutter",
    icon: "/tech-stack/Flutter Icon.png",
  },
  {
    name: "Dart",
    icon: "/tech-stack/Dart Icon.png",
  },
  {
    name: "Kotlin",
    icon: "/tech-stack/Kotlin Icon.png",
  },
  {
    name: "Swift",
    icon: "/tech-stack/Swift Icon.png",
  },
  {
    name: "Spring",
    icon: "/tech-stack/Spring Icon.png",
  },
  {
    name: "MongoDB",
    icon: "/tech-stack/MongoDB Icon.png",
  },
  {
    name: "Firebase",
    icon: "/tech-stack/Firebase Icon.png",
  },
  {
    name: "AWS",
    icon: "/tech-stack/AWS Icon.png",
  },
  {
    name: "Azure",
    icon: "/tech-stack/Azure Icon.png",
  },
  {
    name: "Docker",
    icon: "/tech-stack/Docker Icon.png",
  },
  {
    name: "Tailwind CSS",
    icon: "/tech-stack/Tailwind CSS Icon.png",
  },
  {
    name: "Vue.js",
    icon: "/tech-stack/Vue.js Icon.png",
  },
  {
    name: ".NET",
    icon: "/tech-stack/NET.png",
  },
  {
    name: "GitHub",
    icon: "/tech-stack/GitHub Icon.png",
  },
  {
    name: "Figma",
    icon: "/tech-stack/Figma Icons.png",
  },
  {
    name: "Postman",
    icon: "/tech-stack/Postman Icon.png",
  },
  {
    name: "Swagger",
    icon: "/tech-stack/Swagger Icon.png",
  },
  {
    name: "Android Studio",
    icon: "/tech-stack/Android Studio Icon.png",
  },
  {
    name: "Xcode",
    icon: "/tech-stack/Xcode Icon.png",
  },
]

// Keep ordering deterministic across SSR and hydration.
const shuffledTechStack = [...techStack].sort((a, b) => a.name.localeCompare(b.name))

// Split into 4 columns
const itemsPerColumn = Math.ceil(shuffledTechStack.length / 4)
const firstColumn = shuffledTechStack.slice(0, itemsPerColumn)
const secondColumn = shuffledTechStack.slice(itemsPerColumn, itemsPerColumn * 2)
const thirdColumn = shuffledTechStack.slice(itemsPerColumn * 2, itemsPerColumn * 3)
const fourthColumn = shuffledTechStack.slice(itemsPerColumn * 3)
function TechStackCard({
  name,
  icon,
}: {
  name: string
  icon: string
}) {
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <Image
            src={icon}
            alt={name}
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <div className="font-medium text-foreground text-center">{name}</div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div ref={ref} className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
              <span className="text-sm text-muted-foreground">Tech Stack</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Technologies We{" "}
              <span className="text-primary">Utilize</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive tech stack powers innovative solutions across web, mobile, and cloud platforms.
            </p>
          </motion.div>

          {/* Tech Stack Marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex max-h-[600px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
          >
            <div className="hidden lg:block">
              <Marquee pauseOnHover vertical className="[--duration:25s]">
                {firstColumn.map((tech) => (
                  <TechStackCard key={tech.name} {...tech} />
                ))}
              </Marquee>
            </div>

            <div>
              <Marquee reverse pauseOnHover vertical className="[--duration:20s]">
                {secondColumn.map((tech) => (
                  <TechStackCard key={tech.name} {...tech} />
                ))}
              </Marquee>
            </div>

            <div className="hidden md:block">
              <Marquee pauseOnHover vertical className="[--duration:30s]">
                {thirdColumn.map((tech) => (
                  <TechStackCard key={tech.name} {...tech} />
                ))}
              </Marquee>
            </div>

            <div className="hidden lg:block">
              <Marquee reverse pauseOnHover vertical className="[--duration:25s]">
                {fourthColumn.map((tech) => (
                  <TechStackCard key={tech.name} {...tech} />
                ))}
              </Marquee>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
