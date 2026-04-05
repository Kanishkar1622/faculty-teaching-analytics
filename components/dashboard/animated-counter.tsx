"use client"

import { useState, useEffect } from "react"
import { animate } from "framer-motion"

interface AnimatedCounterProps {
  value: number | string
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  prefix = "", 
  suffix = "",
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  
  const target = typeof value === "number" 
    ? value 
    : parseFloat(value.toString().replace(/[^0-9.]/g, ""))

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest)
    })
    return () => controls.stop()
  }, [target, duration])

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}
