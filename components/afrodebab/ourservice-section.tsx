"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { 
  Code, 
  Cloud, 
  Headphones, 
  Users, 
  Briefcase, 
  Lightbulb, 
  Building2,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Database,
  Settings,
  Shield,
  FileText,
  Zap,
  Network,
  Target,
  ArrowUp,
  CheckCircle,
  Container,
  Ship,
  Lock,
  Gift,
  Bus
} from "lucide-react"

type ServiceItem = {
  name: string
  icon: any
}

type ServiceCategory = {
  title: string
  items: ServiceItem[]
}

const serviceCategories = {
  "Custom Development": {
    description: "We design, build, and deliver production-ready digital platforms for startups, enterprises, and public-sector partners.",
    columns: [
      {
        title: "Custom development projects",
        items: [
          { name: "Website", icon: Monitor },
          { name: "Webapp", icon: Globe },
          { name: "Mobile Application", icon: Smartphone },
          { name: "Backend Systems & APIs", icon: Server },
        ]
      },
      {
        title: "Platform Solutions",
        items: [
          { name: "Enterprise Dashboards", icon: Monitor },
          { name: "Marketplace Platforms", icon: Globe },
          { name: "Logistics Systems", icon: Network },
          { name: "Service Platforms", icon: Settings },
        ]
      },
      {
        title: "Specialized Systems",
        items: [
          { name: "Government Digital Services", icon: Building2 },
          { name: "goGerami Platform", icon: Gift },
          { name: "AddisWay System", icon: Bus },
          { name: "NGO Platforms", icon: Users },
        ]
      },
      {
        title: "Integration Projects",
        items: [
          { name: "API Integration", icon: Network },
          { name: "Third-party Services", icon: Settings },
          { name: "Legacy System Migration", icon: ArrowUp },
          { name: "Data Integration", icon: Database },
        ]
      }
    ]
  },
  "Infrastructure & Operations": {
    description: "We design and manage reliable infrastructure that supports growth, security, and operational efficiency.",
    columns: [
      {
        title: "Cloud Infrastructure",
        items: [
          { name: "AWS Architecture", icon: Cloud },
          { name: "Cloud Migration", icon: ArrowUp },
          { name: "Containerization", icon: Container },
          { name: "Managed Kubernetes", icon: Ship },
        ]
      },
      {
        title: "Security & Compliance",
        items: [
          { name: "Compliance-aligned architecture (ISO/SOC-ready)", icon: Shield },
          { name: "Security-by-design systems", icon: CheckCircle },
          { name: "Access Control", icon: Lock },
          { name: "Security Monitoring", icon: Shield },
        ]
      },
      {
        title: "Operations & Support",
        items: [
          { name: "IT Helpdesk", icon: Headphones },
          { name: "System Monitoring", icon: Monitor },
          { name: "Issue Resolution", icon: Settings },
          { name: "Technical Documentation", icon: FileText },
        ]
      },
      {
        title: "Infrastructure Management",
        items: [
          { name: "Deployment Setup", icon: Settings },
          { name: "Storage & Backup", icon: Database },
          { name: "System Optimization", icon: Zap },
          { name: "Infrastructure Handover", icon: FileText },
        ]
      }
    ]
  },
  "Partnerships & Consulting": {
    description: "We work as a technology partner, delivery arm, or subcontracting team, depending on client needs.",
    columns: [
      {
        title: "Delivery Partnerships",
        items: [
          { name: "Subcontracting Services", icon: Users },
          { name: "Offshore Teams", icon: Globe },
          { name: "Nearshore Teams", icon: Network },
          { name: "Staff Augmentation", icon: Users },
        ]
      },
      {
        title: "Talent & Team",
        items: [
          { name: "Talent Sourcing", icon: Briefcase },
          { name: "Team Management", icon: Users },
          { name: "Performance Oversight", icon: Target },
          { name: "Hybrid Team Models", icon: Network },
        ]
      },
      {
        title: "Consulting Services",
        items: [
          { name: "Digital Strategy", icon: Lightbulb },
          { name: "Platform Design", icon: Code },
          { name: "Digital Transformation", icon: Zap },
          { name: "Technology Roadmaps", icon: FileText },
        ]
      },
      {
        title: "Government Services",
        items: [
          { name: "Public Sector Platforms", icon: Building2 },
          { name: "Policy Alignment", icon: FileText },
          { name: "Data-Driven Planning", icon: Database },
          { name: "Transparency Systems", icon: Shield },
        ]
      }
    ]
  },
}

export function OurServiceSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [activeCategory, setActiveCategory] = useState<keyof typeof serviceCategories>("Custom Development")

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div ref={ref} className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
              <span className="text-sm text-muted-foreground">Our Services</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Our <span className="text-primary">Services</span>
            </h2>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            {Object.keys(serviceCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category as keyof typeof serviceCategories)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-transparent text-foreground hover:text-primary"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center text-foreground text-lg mb-12 max-w-3xl mx-auto"
          >
            {serviceCategories[activeCategory].description}
          </motion.p>

          {/* Services Columns */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {serviceCategories[activeCategory].columns.map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {column.title}
                </h3>
                <ul className="space-y-4">
                  {column.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <div className="shrink-0 w-6 h-6 text-primary">
                        <item.icon className="w-full h-full" />
                      </div>
                      <span className="text-sm leading-relaxed">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
