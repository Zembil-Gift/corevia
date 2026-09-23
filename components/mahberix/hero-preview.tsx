"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion"
import { TrendingUp, Users, Wallet } from "lucide-react"

/**
 * The primary product overview shown in the hero. Wraps the real product
 * screenshot (Z_main) in a premium browser frame with an ambient glow, a
 * scroll-linked 3D tilt that flattens as the user scrolls it into view, a
 * one-time sheen sweep and a set of floating stat chips that drift in.
 */
export function HeroPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Track the frame moving from just-below the fold up through the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.15"],
  })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.6 })

  // Starts tilted back in perspective, then lies flat as it enters view.
  const rotateX = useTransform(p, [0, 0.5], [reduce ? 0 : 18, 0])
  const scale = useTransform(p, [0, 0.5], [reduce ? 1 : 0.94, 1])
  const glow = useTransform(p, [0, 0.6], [0.35, 1])

  return (
    <div ref={ref} className="relative [perspective:1600px]">
      {/* Ambient glow bloom behind the frame */}
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className="pointer-events-none absolute -inset-x-16 -top-16 bottom-0 -z-10"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 45% at 50% 40%, rgba(52,211,153,0.28), transparent 70%), radial-gradient(40% 40% at 80% 20%, rgba(163,230,53,0.16), transparent 70%)",
          }}
        />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX, scale, transformStyle: "preserve-3d" }}
        className="group relative mx-auto max-w-5xl"
      >
        {/* Emerald edge halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[1.4rem] bg-gradient-to-b from-emerald-400/40 via-emerald-500/10 to-transparent opacity-70 blur-[1px]"
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl shadow-emerald-950/40 ring-1 ring-black/40">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-white/5 bg-[#0d1210] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400/90" />
            <span className="h-3 w-3 rounded-full bg-amber-400/90" />
            <span className="h-3 w-3 rounded-full bg-green-400/90" />
            <div className="ml-3 hidden items-center gap-2 rounded-md bg-black/40 px-3 py-1 text-xs text-muted-foreground sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              app.mahberix.com/overview
            </div>
          </div>

          {/* The real product screenshot */}
          <div className="relative">
            <Image
              src="/assets/Z_main_1882x613.png"
              alt="Mahberix company operations dashboard — overview"
              width={1882}
              height={613}
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="h-auto w-full"
            />
            {/* One-time sheen sweep across the shot */}
            {!reduce && (
              <motion.div
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: "160%" }}
                transition={{ duration: 1.6, ease: "easeInOut", delay: 1 }}
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
            )}
          </div>
        </div>

        {/* Floating stat chips that drift in */}
        <FloatChip
          className="-left-4 top-26 sm:-left-10"
          delay={1.1}
          reduce={reduce}
          icon={<Users className="h-4 w-4 text-emerald-300" />}
          label="Active employees"
          value="12"
        />
        <FloatChip
          className="-right-4 top-40 sm:-right-12"
          delay={1.35}
          reduce={reduce}
          icon={<TrendingUp className="h-4 w-4 text-teal-300" />}
          label="Present today"
          value="94%"
        />
        <FloatChip
          className="-bottom-6 left-10 sm:left-24"
          delay={1.6}
          reduce={reduce}
          icon={<Wallet className="h-4 w-4 text-amber-300" />}
          label="Payroll due"
          value="ETB37.5k"
        />
      </motion.div>
    </div>
  )
}

function FloatChip({
  className,
  delay,
  reduce,
  icon,
  label,
  value,
}: {
  className: string
  delay: number
  reduce: boolean | null
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute z-10 hidden sm:block ${className}`}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0e1512]/80 px-4 py-2.5 shadow-xl shadow-black/40 backdrop-blur-md"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
          {icon}
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className="block text-base font-bold tabular-nums text-foreground">{value}</span>
        </span>
      </motion.div>
    </motion.div>
  )
}
