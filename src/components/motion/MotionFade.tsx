"use client"

import { motion, useReducedMotion } from "motion/react"
import type { HTMLMotionProps } from "motion/react"
import { ReactNode } from "react"

type Props = {
  children: ReactNode
  delay?: number
  className?: string
} & Omit<HTMLMotionProps<"div">, "children">

/**
 * Drop-in wrapper that fades children in from below once they enter the
 * viewport. Honours prefers-reduced-motion. Uses framer-motion (already
 * bundled as `motion`).
 */
export function MotionFade({ children, delay = 0, className, ...rest }: Props) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger container: animate each child with the same fade-up effect, with
 * an automatic delay between them.
 */
export function MotionStagger({
  children,
  className,
  step = 0.07,
}: {
  children: ReactNode[]
  className?: string
  step?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: step } },
      }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 14 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
