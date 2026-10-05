import Image from "next/image"
import { cn } from "@/lib/utils"

/** Logo resmi MTs KH A Wahab Muhsin. */
export function Logo({ size = 40, className, priority }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo MTs KH A Wahab Muhsin"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  )
}
